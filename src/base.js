import Parser from 'think-model-abstract/lib/parser'

export default function(target) {
  target.prototype.buildSql = async function() {
    const parser = new Parser(think.config('model'))
    const options = await this.parseOptions(this.options)
    return parser.buildSelectSql(options).trim()
  }
  target.prototype.getSomeFields = function({ obj = {}, fields = [], removeEmpty = false } = {}) {
    const newObj = {}
    Object.keys(obj).forEach((key) => {
      if (fields.indexOf(key) >= 0 && typeof obj[key] !== 'undefined') {
        if (!removeEmpty) {
          newObj[key] = obj[key]
        }
        if (removeEmpty && (obj[key] !== '' || obj[key] === null)) {
          newObj[key] = obj[key]
        }
      }
    })
    return newObj
  }
  target.prototype.getFieldText = function(fields = '') {
    const fieldsObj = this.getFields()
    const fieldArr = Object.keys(fieldsObj)
    const inFieldArr = think.isArray(fields) ? fields : fields.split(',')
    const outFieldArr = []
    for (let i = 0; i < inFieldArr.length; i += 1) {
      const field = inFieldArr[i]
      if (fieldArr.indexOf(field) >= 0) {
        outFieldArr.push(field)
      }
    }
    return outFieldArr.join(',')
  }
  target.prototype.getOrder = function(opt = {}) {
    const queryFields = this.getFields()
    if (typeof opt !== 'object' || typeof queryFields !== 'object') {
      return {}
    }
    const order = {}
    const keys = Object.keys(opt)
    for (let i = 0; i < keys.length; i += 1) {
      const tmpKey = keys[i]
      const field = tmpKey.replace(/Order$/, '')
      let value = opt[tmpKey]
      if (tmpKey !== field && queryFields[field] && value) {
        value = value.toLocaleUpperCase ? value.toLocaleUpperCase() : value
        if (['DESC', 'ASC'].indexOf(value) >= 0) {
          order[field] = value
        }
      }
    }
    if (queryFields.sticky && think.isEmpty(order)) {
      order.sticky = 'DESC'
    }
    if (queryFields.time && !order.time) {
      order.time = 'DESC'
    }
    return order
  }

  target.prototype.getWhere = function(opt = {}) {
    const queryFields = this.getFields()
    if (typeof opt !== 'object' || typeof queryFields !== 'object') {
      return {}
    }
    const where = {}
    const fields = Object.keys(queryFields)
    for (let i = 0; i < fields.length; i += 1) {
      const key = fields[i]
      const fieldObj = queryFields[key]
      if (typeof opt[key] !== 'undefined' && opt[key] !== '') {
        where[key] = opt[key]
      } else {
        const inKey = `${key}s`
        const ins = opt[inKey]
        if (fieldObj.in && ins) {
          where[key] = ['IN', ins.split(',')]
        }
        const numMaxKey = `${key}Max`
        const numMinKey = `${key}Min`
        if (fieldObj.num && (opt[numMaxKey] > 0 || opt[numMinKey] >= 0)) {
          where[key] = {}
          if (numMinKey && opt[numMinKey]) {
            where[key]['>='] = opt[numMinKey]
          }
          if (numMaxKey && opt[numMaxKey]) {
            where[key]['<='] = opt[numMaxKey]
          }
        }
        const likeKey = `${key}Like`
        const likeValue = opt[likeKey]
        if (fieldObj.like && likeValue) {
          where[key] = ['like', `%${likeValue}%`]
        }
        const notLikeKey = `${key}NotLike`
        const notLikeValue = opt[notLikeKey]
        if (fieldObj.notLike && notLikeValue) {
          where[key] = ['NOTLIKE', `%${notLikeValue}%`]
        }
        const notKey = `${key}Not`
        const notValue = opt[notKey]
        if (fieldObj.not && notValue) {
          where[key] = ['!=', notValue]
        }
      }
    }
    return where
  }
  target.prototype.rowsToTree = function({ rows = [], idKey = 'id', parentKey = 'parent', level = 'all', parentId = 0 } = {}) {
    const newRows = []
    const parentIdMap = {}
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]
      const parentValue = row[parentKey] || 0
      if (!parentIdMap[parentValue]) {
        parentIdMap[parentValue] = []
      }
      parentIdMap[parentValue].push(i)
    }

    function addChild(row, l) {
      const id = row[idKey]
      const newRow = row
      const childIndexArr = parentIdMap[id]

      if (childIndexArr && (l === 'all' || l > 0)) {
        newRow.child = []
        for (let i = 0; i < childIndexArr.length; i += 1) {
          newRow.child.push(addChild(rows[childIndexArr[i]], l !== 'all' ? l - 1 : l))
        }
      }
      return newRow
    }

    if (parentIdMap[parentId]) {
      for (let i = 0; i < parentIdMap[parentId].length; i += 1) {
        const rowIndex = parentIdMap[parentId][i]
        const row = addChild(rows[rowIndex], level)
        newRows.push(row)
      }
    }
    return newRows
  }
}
