export default function(target) {
  // 生成需要查询的 model 及 字段
  target.prototype.getJoinFieldObj = function({ modelObj, fields } = {}) {
    const fieldArr = think.isArray(fields) ? fields : fields.split(',')
    const modelArr = Object.keys(modelObj)
    const newFieldObj = {}
    for (let i = 0; i < modelArr.length; i += 1) {
      const modelName = modelArr[i]
      const fieldObj = modelObj[modelName].field
      const modelFieldArr = Object.keys(fieldObj)
      let isJoin = false
      for (let j = 0; j < modelFieldArr.length; j += 1) {
        const oldField = modelFieldArr[j]
        const newField = fieldObj[oldField]
        if (fieldArr.indexOf(newField) >= 0) {
          if (!newFieldObj[modelName]) {
            newFieldObj[modelName] = []
          }
          newFieldObj[modelName].push(newField)
          isJoin = true
        }
      }
    }
    return newFieldObj
  }
  target.prototype.getJoinQuery = function({ rows, modelObj, newFieldObj } = {}) {
    const modelPromise = []
    const promiseArr = []
    Object.keys(newFieldObj).forEach((model) => {
      const joinModelObj = modelObj[model]
      const joinFieldArr = []
      Object.keys(joinModelObj.field).forEach((field) => {
        joinFieldArr.push(`${field} AS ${joinModelObj.field[field]}`)
      })
      const joinOn = joinModelObj.on
      const joinKey = joinOn[0]
      joinFieldArr.push(`${joinKey} AS ${joinOn[1]}`)
      const tmpKeyObj = {}
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i]
        // 如果存在条件
        if (joinModelObj.where) {
          const whereField = joinModelObj.where.field
          const whereVal = joinModelObj.where.val
          if (row[whereField] !== whereVal) {
            continue
          }
        }
        const keyValue = row[joinOn[1]]
        if (typeof keyValue !== 'undefined' && keyValue !== '') {
          tmpKeyObj[keyValue] = true
        }
      }
      const inKey = Object.keys(tmpKeyObj)
      if (inKey.length > 0) {
        const where = {}
        where[joinKey] = ['IN', inKey]
        modelPromise.push(model)
        promiseArr.push(this.model(model).where(where).field(joinFieldArr.join(',')).select())
      }
    })
    return [modelPromise, promiseArr]
  }

  target.prototype.getJoinResultData = async function({ modelObj, modelPromise, promiseArr } = {}) {
    const resultData = {}
    if (!think.isEmpty(promiseArr)) {
      const newRowsArr = await Promise.all(promiseArr)
      for (let i = 0; i < newRowsArr.length; i += 1) {
        const model = modelPromise[i]
        const newRows = newRowsArr[i]
        const type = modelObj[model].type
        const key = modelObj[model].on[1]
        if (type === 'HAS_MANY') {
          const keyToIndexArr = {}
          for (let j = 0; j < newRows.length; j += 1) {
            const row = newRows[j]
            if (!keyToIndexArr[row[key]]) {
              keyToIndexArr[row[key]] = []
            }
            keyToIndexArr[row[key]].push(j)
          }
          resultData[model] = { keyToIndexArr, newRows }
        } else {
          const keyToIndex = {}
          for (let j = 0; j < newRows.length; j += 1) {
            keyToIndex[newRows[j][key]] = j
          }
          resultData[model] = { keyToIndex, newRows }
        }
      }
    }
    return resultData
  }

  target.prototype.getQueryJoinModel = function({ where, model } = {}) {
    const asFields = {}
    if (where) {
      const joinModelConf = this.getJoinModel ? this.getJoinModel() || {} : {}
      const joinModelArr = []
      Object.keys(joinModelConf).forEach((table) => {
        const tmpModelConf = joinModelConf[table]
        if (tmpModelConf.type === 'HAS_MANY') {
          const fieldConf = tmpModelConf.field
          Object.keys(fieldConf).forEach((field) => {
            const onField = fieldConf[field]
            let whereVal = where[onField] || where[field]
            if (whereVal) {
              whereVal += ''
              const joinModel = {}
              joinModel.tableName = table
              joinModel.conf = joinModelConf[table]
              joinModel.where = {}
              joinModel.where = field + (whereVal.indexOf(',') > 0 ? ` IN ( ${whereVal.split(',')} )` : ` = ${whereVal}`)
              joinModelArr.push(joinModel)
            }
          })
        }
      })
      if (!think.isEmpty(joinModelArr)) {
        joinModelArr.forEach(async(joinMode) => {
          const conf = joinMode.conf
          const sql = `SELECT DISTINCT ${conf.on[0]} FROM ${this.tablePrefix}${joinMode.tableName} WHERE ( ${joinMode.where} )`
          if (conf.on[1] === conf.on[0]) {
            asFields[conf.on[1]] = `${this.tableName}.${conf.on[1]} as ${conf.on[1]}`
          }
          model.join({
            join: 'inner',
            table: sql,
            as: joinMode.tableName,
            on: [conf.on[1], conf.on[0]]
          })
        })
      }
    }
    return { model, asFields }
  }

  target.prototype.dataJoinField = async function({ data, fields } = {}) {
    if (think.isEmpty(data) || think.isEmpty(fields)) {
      return data
    }
    const rows = think.isArray(data) ? data : [data]
    const modelObj = this.getJoinModel ? this.getJoinModel() : {}
    const newFieldObj = this.getJoinFieldObj({ modelObj, fields })
    if (think.isEmpty(newFieldObj)) {
      return data
    }

    // 生成查询
    const [modelPromise, promiseArr] = this.getJoinQuery({ rows, modelObj, newFieldObj })

    // 获取数据
    const resultData = await this.getJoinResultData({ modelObj, modelPromise, promiseArr })

    // 组装数据
    Object.keys(newFieldObj).forEach((model) => {
      const joinModelObj = modelObj[model]
      const newFields = newFieldObj[model]
      const type = joinModelObj.type // 1对1 1对多
      const whereObj = joinModelObj.where // 条件
      for (let i = 0; i < rows.length; i += 1) {
        const newRow = rows[i]
        if (whereObj) {
          const whereField = whereObj.field
          const whereVal = whereObj.val
          if (newRow[whereField] !== whereVal) {
            continue
          }
        }
        for (let j = 0; j < newFields.length; j += 1) {
          const newField = newFields[j]
          newRow[newField] = ''
          const modelData = resultData[model]
          if (modelData) {
            const joinOn = modelObj[model].on
            const oldField = newRow[joinOn[1]]
            if (type === 'HAS_MANY' && modelData.keyToIndexArr && modelData.newRows) {
              const indexArr = modelData.keyToIndexArr[oldField] || []
              const tmpValArr = []
              indexArr.forEach((index) => {
                tmpValArr.push(modelData.newRows[index] ? modelData.newRows[index][newField] || '' : '')
              })
              newRow[newField] = tmpValArr.join(',')
            }
            if (modelData.keyToIndex && modelData.newRows) {
              const index = modelData.keyToIndex[oldField]
              if (index >= 0) {
                newRow[newField] = modelData.newRows[index] ? modelData.newRows[index][newField] || '' : ''
              }
            }
          }
        }
      }
    })
    return think.isArray(data) ? rows : rows[0]
  }
}
