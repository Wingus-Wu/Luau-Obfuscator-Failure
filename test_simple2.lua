if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutyhhABQcv={};for _i=0,255 do _lutyhhABQcv[_i]=bit32.bxor(_i,244) end;local _dcjO2nC3Mm={};local function _dec0NICUYL1(v)
  local c=_dcjO2nC3Mm[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutyhhABQcv[v[i]])end;return s end)
  if ok then _dcjO2nC3Mm[v]=r;return r end
  return v
end
local _nmhL1JI8Yp_r={[0]={128,149,150,152,145},{147,145,128,171,135,129,150,135,145,128,135},{157,132,149,157,134,135},{132,134,157,154,128}};local _nmhL1JI8Yp={};setmetatable(_nmhL1JI8Yp,{__index=function(_,k)
  local v=rawget(_nmhL1JI8Yp_r,k);local d=_dec0NICUYL1(v);rawset(_nmhL1JI8Yp,k,d);return d
end})
local _cplshEdzlW46 = {}
_cplshEdzlW46[0] = {[0]={[0]={143,212},{151,155,154,151,149,128},{216,212},{212,137}},{[0]=1,2,3},{},{}}
_cplshEdzlW46[0].__d = {[0]=1,1,1,0,0,0,0}
_cplshEdzlW46[0].__s = {[0]=0,1,2,0,1,2,3}
_cplshEdzlW46[1] = {[0]={[0]={157,154,135,145,134,128},{129,154,132,149,151,159},{134,145,153,155,130,145}},{[0]=1},{},{}}
_cplshEdzlW46[1].__d = {[0]=1,0,0,0}
_cplshEdzlW46[1].__s = {[0]=0,0,1,2}
local _psuruWDbF0 = {[0] = {bc = {{218,1},{206,1},{212},{208,0},{207},{208,1},{207},{208,2},{207},{195,0},{205,1},{196,0},{202,1,1},{195,1},{205,2},{196,1},{202,1,3},{195,4},{195,3},{195,2},{196,2},{196,3},{196,4},{202,2,2},{195,5},{195,4},{196,4},{192,40},{205,3},{208,3},{205,0},{209,4},{196,5},{208,5},{202,2,1},{203,16},{208,6},{203,16},{202,1,0},{215,20},{194}}, cp = {[0]=1,2,3,{143,212},{151,155,154,151,149,128},{216,212},{212,137}}, np = 0},[1] = {bc = {{196,1},{199},{222,5},{220,1},{208,0},{195,1},{196,2},{199},{222,11},{220,1},{212},{195,2},{196,3},{199},{222,17},{220,1},{212},{195,3},{196,1},{196,0},{219,3},{203,8},{192,36},{205,0},{209,1},{196,3},{212},{205,0},{209,2},{196,2},{202,1,1},{207},{202,2,0},{210,2},{196,3},{201,1},{205,1},{196,0},{196,1},{208,0},{203,11},{196,2},{196,3},{202,4,0},{205,0},{209,1},{196,2},{196,0},{196,1},{216},{202,2,0},{205,1},{196,0},{196,1},{208,0},{203,11},{196,2},{196,3},{202,4,0},{205,0},{209,3},{196,2},{202,1,0},{210,1},{196,3},{201,1},{201,0}}, cp = {[0]=1,{157,154,135,145,134,128},{129,154,132,149,151,159},{134,145,153,155,130,145}}, np = 4}}
local _bccs7NzLmb = {[1]=function(a,b) return a or b end,[2]=function(a,b) return a - b end,[3]=function(a,b) return bit32.lshift(a, b) end,[4]=function(a,b) return a ~= b end,[5]=function(a,b) return a <= b end,[6]=function(a,b) return a / b end,[7]=function(a,b) return a and b end,[8]=function(a,b) return a > b end,[9]=function(a,b) return a ^ b end,[10]=function(a,b) return a < b end,[11]=function(a,b) return a + b end,[12]=function(a,b) return a >= b end,[13]=function(a,b) return bit32.rshift(a, b) end,[14]=function(a,b) return bit32.bor(a, b) end,[15]=function(a,b) return a == b end,[16]=function(a,b) return tostring(a) .. tostring(b) end,[17]=function(a,b) return a * b end,[18]=function(a,b) return a % b end,[19]=function(a,b) return bit32.band(a, b) end,[20]=function(a,b) return a // b end}
local _unMUcwRHi2 = {[1]=function(a) return -a end,[2]=function(a) return bit32.bnot(a) end,[3]=function(a) return #a end,[4]=function(a) return not a end}
local _enZrEUrgL4 = {}
for _i = 0, 3 do local _n = _nmhL1JI8Yp[_i]; if _n ~= nil then _enZrEUrgL4[_n] = _G[_n] end end
local function _rslvefcf4per(key)
  if _enZrEUrgL4[key] == nil and key ~= "nil" then
    _enZrEUrgL4[key] = _G[key]
  end
  return _enZrEUrgL4[key]
end
local _vmwSpOKUsV
local function _h950750(_st299OSZz7, instr, ctx)
  local obj=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; local val=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; obj[_dec0NICUYL1(_cplshEdzlW46[ctx.pIdx or 0][_cplshEdzlW46[ctx.pIdx or 0].__d[instr[2]]][_cplshEdzlW46[ctx.pIdx or 0].__s[instr[2]]])]=val
end
local function _h679839(_st299OSZz7, instr, ctx)
  _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=_st299OSZz7.locals[instr[2]]
end
local function _h424712(_st299OSZz7, instr, ctx)
  _st299OSZz7.halt=true
end
local function _h251172(_st299OSZz7, instr, ctx)
  local v=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1
      if v then _st299OSZz7.pc=instr[2] end
end
local function _h760601(_st299OSZz7, instr, ctx)
  local nargs=instr[2]
      local nresults=instr[3] or 1
      local methodName=_st299OSZz7.stack[_st299OSZz7.sp]
      _st299OSZz7.sp=_st299OSZz7.sp-1
      local obj=_st299OSZz7.stack[_st299OSZz7.sp-nargs]
      local fn=obj[methodName]
      local callArgs={obj}
      for i=1,nargs do callArgs[i+1]=_st299OSZz7.stack[_st299OSZz7.sp-nargs+i] end
      _st299OSZz7.sp=_st299OSZz7.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs+1))}
      for i=1,nresults do _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=rets[i] end
end
local function _h629654(_st299OSZz7, instr, ctx)
  for i=1,#_st299OSZz7.varargs do _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=_st299OSZz7.varargs[i] end
end
local function _h369260(_st299OSZz7, instr, ctx)
  local idx=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; local obj=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.stack[_st299OSZz7.sp]=obj[idx]
end
local function _h664681(_st299OSZz7, instr, ctx)
  local t=_st299OSZz7.stack[_st299OSZz7.sp]
      for i=1,#_st299OSZz7.varargs do t[#t+1]=_st299OSZz7.varargs[i] end
end
local function _h514640(_st299OSZz7, instr, ctx)
  local nargs=instr[2]
      local nresults=instr[3] or 1
      local fn=_st299OSZz7.stack[_st299OSZz7.sp-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=_st299OSZz7.stack[_st299OSZz7.sp-nargs+i] end
      _st299OSZz7.sp=_st299OSZz7.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs))}
      for i=1,nresults do _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=rets[i] end
end
local function _h617581(_st299OSZz7, instr, ctx)
  local b=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; local a=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=tostring(a)..tostring(b)
end
local function _h449526(_st299OSZz7, instr, ctx)
  _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=nil
end
local function _h732436(_st299OSZz7, instr, ctx)
  _st299OSZz7.sp=_st299OSZz7.sp-instr[2]
end
local function _h901178(_st299OSZz7, instr, ctx)
  local _idx=instr[2]; _st299OSZz7.locals[_idx]=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1
end
local function _h842721(_st299OSZz7, instr, ctx)
  local b=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; local a=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.stack[_st299OSZz7.sp]=_bccs7NzLmb[instr[2]](a,b)
end
local function _h510588(_st299OSZz7, instr, ctx)
end
local function _h842969(_st299OSZz7, instr, ctx)
  _st299OSZz7.pc=instr[2]
end
local function _h831930(_st299OSZz7, instr, ctx)
  _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]={}
end
local function _h204213(_st299OSZz7, instr, ctx)
  _st299OSZz7.stack[_st299OSZz7.sp]=#_st299OSZz7.stack[_st299OSZz7.sp]
end
local function _h904002(_st299OSZz7, instr, ctx)
  _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=_enZrEUrgL4[_nmhL1JI8Yp[instr[2]]]
end
local function _h631363(_st299OSZz7, instr, ctx)
  _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=_st299OSZz7.stack[_st299OSZz7.sp-1]
end
local function _h191239(_st299OSZz7, instr, ctx)
  _st299OSZz7.stack[_st299OSZz7.sp]=_st299OSZz7.stack[_st299OSZz7.sp][_dec0NICUYL1(_cplshEdzlW46[ctx.pIdx or 0][_cplshEdzlW46[ctx.pIdx or 0].__d[instr[2]]][_cplshEdzlW46[ctx.pIdx or 0].__s[instr[2]]])]
end
local function _h556319(_st299OSZz7, instr, ctx)
  _st299OSZz7.sp=_st299OSZz7.sp+1; _st299OSZz7.stack[_st299OSZz7.sp]=_dec0NICUYL1(_cplshEdzlW46[ctx.pIdx or 0][_cplshEdzlW46[ctx.pIdx or 0].__d[instr[2]]][_cplshEdzlW46[ctx.pIdx or 0].__s[instr[2]]])
end
local function _h457935(_st299OSZz7, instr, ctx)
  local t=_st299OSZz7.stack[_st299OSZz7.sp-1]; local val=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; t[#t+1]=val
end
local function _h495871(_st299OSZz7, instr, ctx)
  _enZrEUrgL4[_nmhL1JI8Yp[instr[2]]]=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1
end
local function _h322508(_st299OSZz7, instr, ctx)
  _st299OSZz7.sp=_st299OSZz7.sp+1
      local _pi=instr[2]
      local _vmf=_vmwSpOKUsV
      _st299OSZz7.stack[_st299OSZz7.sp]=function(...)
        local _args={...}
        local _rets={_vmf(_pi,_enZrEUrgL4,_args)}
        if #_rets>0 then return table.unpack(_rets) end
        return nil
      end
end
local function _h801146(_st299OSZz7, instr, ctx)
  local v=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1
      if not v then _st299OSZz7.pc=instr[2] end
end
local function _h255175(_st299OSZz7, instr, ctx)
  local nret=instr[2]
      local rets={}
      for i=nret,1,-1 do
        rets[i]=_st299OSZz7.stack[_st299OSZz7.sp]
        _st299OSZz7.sp=_st299OSZz7.sp-1
      end
      _st299OSZz7.ret=rets
end
local function _h931543(_st299OSZz7, instr, ctx)
  local val=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; local idx=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; local obj=_st299OSZz7.stack[_st299OSZz7.sp]; _st299OSZz7.sp=_st299OSZz7.sp-1; obj[idx]=val
end
local function _h700585(_st299OSZz7, instr, ctx)
  _st299OSZz7.stack[_st299OSZz7.sp]=_unMUcwRHi2[instr[2]](_st299OSZz7.stack[_st299OSZz7.sp])
end
local function _h480956(_st299OSZz7, instr, ctx)
end
local _hdKlLG0vgm = {}
_hdKlLG0vgm[214] = _h950750
_hdKlLG0vgm[196] = _h679839
_hdKlLG0vgm[194] = _h424712
_hdKlLG0vgm[222] = _h251172
_hdKlLG0vgm[221] = _h760601
_hdKlLG0vgm[223] = _h629654
_hdKlLG0vgm[216] = _h369260
_hdKlLG0vgm[200] = _h664681
_hdKlLG0vgm[202] = _h514640
_hdKlLG0vgm[193] = _h617581
_hdKlLG0vgm[198] = _h449526
_hdKlLG0vgm[220] = _h732436
_hdKlLG0vgm[195] = _h901178
_hdKlLG0vgm[203] = _h842721
_hdKlLG0vgm[213] = _h510588
_hdKlLG0vgm[215] = _h842969
_hdKlLG0vgm[212] = _h831930
_hdKlLG0vgm[197] = _h204213
_hdKlLG0vgm[205] = _h904002
_hdKlLG0vgm[199] = _h631363
_hdKlLG0vgm[209] = _h191239
_hdKlLG0vgm[208] = _h556319
_hdKlLG0vgm[207] = _h457935
_hdKlLG0vgm[206] = _h495871
_hdKlLG0vgm[218] = _h322508
_hdKlLG0vgm[192] = _h801146
_hdKlLG0vgm[201] = _h255175
_hdKlLG0vgm[217] = _h931543
_hdKlLG0vgm[219] = _h700585
_hdKlLG0vgm[210] = _h480956
_vmwSpOKUsV = function(protoIdx, _enZrEUrgL4, args)
  local proto = _psuruWDbF0[protoIdx]
  local bc = proto.bc
  local _st299OSZz7 = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do _st299OSZz7.locals[i-1]=_st299OSZz7.varargs[i] end
  while true do
    local instr = bc[_st299OSZz7.pc + 1]
    if instr == nil then break end
    _st299OSZz7.pc = _st299OSZz7.pc + 1
    _st299OSZz7.ret = nil
    local op = instr[1]
    local handler = _hdKlLG0vgm[op]
    if handler == nil then break end
    handler(_st299OSZz7, instr, {pIdx=protoIdx})
    if _st299OSZz7.halt then break end
    if _st299OSZz7.ret then return table.unpack(_st299OSZz7.ret) end
  end
  return nil
end
_vmwSpOKUsV(0, _enZrEUrgL4, {})
