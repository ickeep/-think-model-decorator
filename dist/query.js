'use strict';var _assign=require('babel-runtime/core-js/object/assign'),_assign2=_interopRequireDefault(_assign),_promise=require('babel-runtime/core-js/promise'),_promise2=_interopRequireDefault(_promise),_keys=require('babel-runtime/core-js/object/keys'),_keys2=_interopRequireDefault(_keys),_regenerator=require('babel-runtime/regenerator'),_regenerator2=_interopRequireDefault(_regenerator),_asyncToGenerator2=require('babel-runtime/helpers/asyncToGenerator'),_asyncToGenerator3=_interopRequireDefault(_asyncToGenerator2);exports.__esModule=!0;exports.default=function(a){a.prototype.detail=function(){var a=(0,_asyncToGenerator3.default)(/*#__PURE__*/_regenerator2.default.mark(function a(){var b,c,d,e=0<arguments.length&&arguments[0]!==void 0?arguments[0]:{},f=e.where,g=e.fields;return _regenerator2.default.wrap(function(a){for(;;)switch(a.prev=a.next){case 0:return b=this.getWhere(f),c=this.where(b),g&&(c=c.field(this.getFieldText(g))),a.next=5,c.field(this.getFieldText(g)).find();case 5:return d=a.sent,a.next=8,this.dataJoinField({data:d,fields:g});case 8:return d=a.sent,a.abrupt('return',d);case 10:case'end':return a.stop();}},a,this)}));return function(){return a.apply(this,arguments)}}(),a.prototype.rows=function(){var a=(0,_asyncToGenerator3.default)(/*#__PURE__*/_regenerator2.default.mark(function a(){var b,c,d,e,f,g,h,i,j,k,l,m=0<arguments.length&&arguments[0]!==void 0?arguments[0]:{},n=m.where,o=m.order,p=m.fields,q=m.limit,r=q===void 0?10:q,s=m.group,t=m.returnSql,u=t!==void 0&&t;return _regenerator2.default.wrap(function(a){for(;;)switch(a.prev=a.next){case 0:if(b=this.getWhere(n),c=this.getOrder(o),d=[],e={},f=this,g=this.getQueryJoinModel({where:n,model:f}),f=g.model,e=g.asFields,h=this.getFieldText(p),think.isEmpty(e)||(h=','+h+',',(0,_keys2.default)(e).forEach(function(a){h=h.replace(','+a+',',','+e[a]+',')}),h=h.replace(/(^,)?(,$)?/g,'')),f=f.where(b).order(c).field(h),!s){a.next=27;break}return a.next=14,f.buildSql();case 14:if(i=a.sent,j=[],h?h.split(',').forEach(function(a){if(0<=a.indexOf(' as ')){var b=a.split(' as ')[1];j.push('ANY_VALUE(`'+b+'`) as `'+b+'`')}else j.push('ANY_VALUE(`'+a+'`) as `'+a+'`')}):this.getFields().forEach(function(a){j.push('ANY_VALUE(`'+a+'`) as `'+a+'`')}),k='SELECT '+j.join(',')+' FROM ('+i+' LIMIT 9999999999999999) as G GROUP BY `'+s+'`',think.isEmpty(c)||(k+=' ORDER BY ',(0,_keys2.default)(c).forEach(function(a){k+='`'+a+'` '+c[a]+','}),k=k.replace(/,$/,'')),l=0<r?k+' LIMIT '+r:k,!u){a.next=22;break}return a.abrupt('return',l);case 22:return a.next=24,this.query(l);case 24:d=a.sent,a.next=33;break;case 27:if(0<r&&(f=f.limit(r)),!u){a.next=30;break}return a.abrupt('return',f.buildSql());case 30:return a.next=32,f.select();case 32:d=a.sent;case 33:return a.next=35,this.dataJoinField({data:d,fields:p});case 35:return d=a.sent,a.abrupt('return',d);case 37:case'end':return a.stop();}},a,this)}));return function(){return a.apply(this,arguments)}}(),a.prototype.list=function(){var a=(0,_asyncToGenerator3.default)(/*#__PURE__*/_regenerator2.default.mark(function a(b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s=b.where,t=b.order,u=b.page,v=u===void 0?1:u,w=b.pageSize,x=w===void 0?10:w,y=b.fields,z=b.group;return _regenerator2.default.wrap(function(a){for(;;)switch(a.prev=a.next){case 0:if(c={},d={},e=this.getWhere(s),f=this.getOrder(t),g=this,h=this.getQueryJoinModel({where:s,model:g}),g=h.model,d=h.asFields,g=g.where(e).order(f),i=this.getFieldText(y),think.isEmpty(d)||(i=','+i+',',(0,_keys2.default)(d).forEach(function(a){i=i.replace(','+a+',',','+d[a]+',')}),i=i.replace(/(^,)?(,$)?/g,'')),g=g.field(i),!z){a.next=31;break}return a.next=15,g.buildSql();case 15:return j=a.sent,k=[],i?i.split(',').forEach(function(a){if(0<=a.indexOf(' as ')){var b=a.split(' as ')[1];k.push('ANY_VALUE(`'+b+'`) as `'+b+'`')}else k.push('ANY_VALUE(`'+a+'`) as `'+a+'`')}):this.getFields().forEach(function(a){k.push('ANY_VALUE(`'+a+'`) as `'+a+'`')}),l='SELECT '+k.join(',')+' FROM ('+j+' LIMIT 9999999999999999) as G GROUP BY `'+z+'`',think.isEmpty(f)||(l+=' ORDER BY ',(0,_keys2.default)(f).forEach(function(a){l+='`'+a+'` '+f[a]+','}),l=l.replace(/,$/,'')),m=l+' LIMIT '+(v-1)*x+', '+x,n='SELECT COUNT(id) AS think_count FROM (SELECT `'+z+'`,ANY_VALUE(id) as id FROM ('+j+') as G GROUP BY `'+z+'`) as C',a.next=24,_promise2.default.all([this.query(n),this.query(m)]);case 24:o=a.sent,p=o[0],q=o[1],r=p[0].think_count,c={count:r,totalPages:Math.ceil(r/x),pagesize:parseInt(x,10),currentPage:parseInt(v,10),data:q},a.next=36;break;case 31:if(!i){a.next=36;break}return g.page(v||1,x||10),a.next=35,g.countSelect();case 35:c=a.sent;case 36:return a.next=38,this.dataJoinField({data:c.data,fields:y});case 38:return c.data=a.sent,a.abrupt('return',c);case 40:case'end':return a.stop();}},a,this)}));return function(){return a.apply(this,arguments)}}(),a.prototype.eachGroup=function(){var a=(0,_asyncToGenerator3.default)(/*#__PURE__*/_regenerator2.default.mark(function a(){var b,c,d,e,f,g,h,i,j,k=0<arguments.length&&arguments[0]!==void 0?arguments[0]:{},l=k.num,m=l===void 0?10:l,n=k.fields,o=n===void 0?'':n,p=k.group,q=p===void 0?'':p,r=k.join,s=k.groupModel,t=s===void 0?'':s,u=k.groupModelOn,v=u===void 0?[]:u,w=k.order,x=w===void 0?'':w,y=k.where,z=y===void 0?'':y,A=k.joinField,B=k.limit;return _regenerator2.default.wrap(function(a){for(;;)switch(a.prev=a.next){case 0:if(b='',c=this,d=r?o:o?this.getFieldText(o):'*','*'!==d&&0>d.indexOf(q)&&(d+=','+q),c=r?c.join(r).field(d.replace('id,',this.tableName+'.id,')):c.field(d),e='if(@group_id='+q+',@num:=@num+1,@num:=1) as count,@group_id:='+q+' ',f={},f[q]='ASC',f=(0,_assign2.default)(f,this.getOrder(x)),!t){a.next=16;break}return a.next=12,c.order(f).where(z).join({table:t,join:'inner',as:t,on:v}).buildSql();case 12:g=a.sent,b='SELECT '+d.replace(this.tableName+'.','')+','+e+' from ('+g+') AS A ',a.next=19;break;case 16:return a.next=18,c.field(d+','+e).where(z).order(f).buildSql();case 18:b=a.sent;case 19:return h=this.table('('+b+') as temp').field(''+d).where({count:['<=',parseInt(m,10)]}),0<B&&(h=h.limit(B)),a.next=23,h.buildSql();case 23:return i=a.sent,a.next=26,this.execute('set @num=0;');case 26:return a.next=28,this.query(''+b);case 28:return a.next=30,this.execute('set @num=0;');case 30:return a.next=32,this.query(i);case 32:if(j=a.sent,!(A!==void 0)||A){a.next=35;break}return a.abrupt('return',j);case 35:return a.abrupt('return',this.dataJoinField({data:j,fields:o}));case 36:case'end':return a.stop();}},a,this)}));return function(){return a.apply(this,arguments)}}()};function _interopRequireDefault(a){return a&&a.__esModule?a:{default:a}}