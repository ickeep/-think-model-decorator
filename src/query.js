export default function(target) {
  target.prototype.detail = async function({ where, fields } = {}) {
    const whereOpt = this.getWhere(where)
    let model = this.where(whereOpt)
    if (fields) {
      model = model.field(this.getFieldText(fields))
    }
    let row = await model.field(this.getFieldText(fields)).find()
    row = await this.dataJoinField({ data: row, fields })
    return row
  }

  target.prototype.rows = async function({ where, order, fields, limit = 10, group, returnSql = false } = {}) {
    const whereOpt = this.getWhere(where)
    const orderOpt = this.getOrder(order)
    let rows = []
    let asFields = {}
    let model = this
    const joinModelObj = this.getQueryJoinModel({ where, model })
    model = joinModelObj.model
    asFields = joinModelObj.asFields
    let modelFields = this.getFieldText(fields)
    if (!think.isEmpty(asFields)) {
      modelFields = `,${modelFields},`
      Object.keys(asFields).forEach((field) => {
        modelFields = modelFields.replace(`,${field},`, `,${asFields[field]},`)
      })
      modelFields = modelFields.replace(/(^,)?(,$)?/g, '')
    }
    model = model.where(whereOpt).order(orderOpt).field(modelFields)
    if (group) {
      const sql = await model.buildSql()
      const fieldsArr = []
      if (modelFields) {
        modelFields.split(',').forEach((field) => {
          if (field.indexOf(' as ') >= 0) {
            const tmpField = field.split(' as ')[1]
            fieldsArr.push(`ANY_VALUE(\`${tmpField}\`) as \`${tmpField}\``)
          } else {
            fieldsArr.push(`ANY_VALUE(\`${field}\`) as \`${field}\``)
          }
        })
      } else {
        this.getFields().forEach((field) => {
          fieldsArr.push(`ANY_VALUE(\`${field}\`) as \`${field}\``)
        })
      }
      let groupSql = `SELECT ${fieldsArr.join(',')} FROM (${sql} LIMIT 9999999999999999) as G GROUP BY \`${group}\``
      if (!think.isEmpty(orderOpt)) {
        groupSql += ' ORDER BY '
        Object.keys(orderOpt).forEach((key) => {
          groupSql += `\`${key}\` ${orderOpt[key]},`
        })
        groupSql = groupSql.replace(/,$/, '')
      }
      const groupPageSql = limit > 0 ? `${groupSql} LIMIT ${limit}` : groupSql
      if (returnSql) {
        return groupPageSql
      }
      rows = await this.query(groupPageSql)
    } else {
      if (limit > 0) {
        model = model.limit(limit)
      }
      if (returnSql) {
        return model.buildSql()
      }
      rows = await model.select()
    }
    rows = await this.dataJoinField({ data: rows, fields })
    return rows
  }

  target.prototype.list = async function({ where, order, page = 1, pageSize = 10, fields, group }) {
    let pageData = {}
    let asFields = {}
    const whereOpt = this.getWhere(where)
    const orderOpt = this.getOrder(order)
    let model = this
    const joinModelObj = this.getQueryJoinModel({ where, model })
    model = joinModelObj.model
    asFields = joinModelObj.asFields
    model = model.where(whereOpt).order(orderOpt)
    let modelFields = this.getFieldText(fields)
    if (!think.isEmpty(asFields)) {
      modelFields = `,${modelFields},`
      Object.keys(asFields).forEach((field) => {
        modelFields = modelFields.replace(`,${field},`, `,${asFields[field]},`)
      })
      modelFields = modelFields.replace(/(^,)?(,$)?/g, '')
    }
    model = model.field(modelFields)
    if (group) {
      const sql = await model.buildSql()
      const fieldsArr = []
      if (modelFields) {
        modelFields.split(',').forEach((field) => {
          if (field.indexOf(' as ') >= 0) {
            const tmpField = field.split(' as ')[1]
            fieldsArr.push(`ANY_VALUE(\`${tmpField}\`) as \`${tmpField}\``)
          } else {
            fieldsArr.push(`ANY_VALUE(\`${field}\`) as \`${field}\``)
          }
        })
      } else {
        this.getFields().forEach((field) => {
          fieldsArr.push(`ANY_VALUE(\`${field}\`) as \`${field}\``)
        })
      }
      let groupSql = `SELECT ${fieldsArr.join(',')} FROM (${sql} LIMIT 9999999999999999) as G GROUP BY \`${group}\``
      if (!think.isEmpty(orderOpt)) {
        groupSql += ' ORDER BY '
        Object.keys(orderOpt).forEach((key) => {
          groupSql += `\`${key}\` ${orderOpt[key]},`
        })
        groupSql = groupSql.replace(/,$/, '')
      }
      const groupPageSql = `${groupSql} LIMIT ${(page - 1) * pageSize}, ${pageSize}`
      const countSql = `SELECT COUNT(id) AS think_count FROM (SELECT \`${group}\`,ANY_VALUE(id) as id FROM (${sql}) as G GROUP BY \`${group}\`) as C`
      const [countRows, groupPageData] = await Promise.all([
        this.query(countSql),
        this.query(groupPageSql)
      ])
      const count = countRows[0].think_count
      pageData = {
        count,
        totalPages: Math.ceil(count / pageSize),
        pagesize: parseInt(pageSize, 10),
        currentPage: parseInt(page, 10),
        data: groupPageData
      }
    } else if (modelFields) {
      model.page(page || 1, pageSize || 10)
      pageData = await model.countSelect()
    }
    pageData.data = await this.dataJoinField({ data: pageData.data, fields })
    return pageData
  }

  target.prototype.eachGroup = async function({ num = 10, fields = '', group = '', join, groupModel = '', groupModelOn = [], order = '', where = '', joinField = true, limit } = {}) {
    let tmpSql = ''
    let model = this
    let fieldText = join ? fields : (fields ? this.getFieldText(fields) : '*')
    if (fieldText !== '*' && fieldText.indexOf(group) < 0) {
      fieldText += `,${group}`
    }
    if (join) {
      model = model.join(join).field(fieldText.replace('id,', `${this.tableName}.id,`))
    } else {
      model = model.field(fieldText)
    }

    const tmpFields = `if(@group_id=${group},@num:=@num+1,@num:=1) as count,@group_id:=${group} `
    let orderObj = {}
    orderObj[group] = 'ASC'
    orderObj = Object.assign(orderObj, this.getOrder(order))
    if (groupModel) {
      const sql = await model
        .order(orderObj)
        .where(where)
        .join({
          table: groupModel,
          join: 'inner',
          as: groupModel,
          on: groupModelOn
        })
        .buildSql()
      tmpSql = `SELECT ${fieldText.replace(`${this.tableName}.`, '')},${tmpFields} from (${sql}) AS A `
    } else {
      tmpSql = await model.field(`${fieldText},${tmpFields}`).where(where).order(orderObj).buildSql()
    }
    let tableModel = this.table(`(${tmpSql}) as temp`).field(`${fieldText}`).where({ count: ['<=', parseInt(num, 10)] })
    if (limit > 0) {
      tableModel = tableModel.limit(limit)
    }
    const sqlStr = await tableModel.buildSql()
    await this.execute('set @num=0;')
    await this.query(`${tmpSql}`) // 必须先执行子查询 要不然会返回所有的数据
    await this.execute('set @num=0;')
    const rows = await this.query(sqlStr)
    if (!joinField) {
      return rows
    }
    return this.dataJoinField({ data: rows, fields })
  }
}
