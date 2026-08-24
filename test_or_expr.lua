if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutvjO2nC3M={};for _i=0,255 do _lutvjO2nC3M[_i]=bit32.bxor(_i,12) end;local _dcm0NICUYL={};local function _dec10OZyD7i(v)
  local c=_dcm0NICUYL[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutvjO2nC3M[v[i]])end;return s end)
  if ok then _dcm0NICUYL[v]=r;return r end
  return v
end
local _nmpcs7NzLm_r={[0]={83,56,104,97},{124,126,101,98,120}};local _nmpcs7NzLm={};setmetatable(_nmpcs7NzLm,{__index=function(_,k)
  local v=rawget(_nmpcs7NzLm_r,k);local d=_dec10OZyD7i(v);rawset(_nmpcs7NzLm,k,d);return d
end})
local _cpls67yhhABQ = {}
_cpls67yhhABQ[0] = {[0]={},{[0]=1,2,3},{},{}}
_cpls67yhhABQ[0].__d = {[0]=1,1,1}
_cpls67yhhABQ[0].__s = {[0]=0,1,2}
_cpls67yhhABQ[1] = {[0]={},{[0]=10,20,30},{},{}}
_cpls67yhhABQ[1].__d = {[0]=1,1,1}
_cpls67yhhABQ[1].__s = {[0]=0,1,2}
local _ps0KlLG0vg = {[0] = {bc = {{124,1},{105,0},{114,1},{114,0},{99,0,1},{99,1,0},{114,1},{114,0},{122,0},{99,1,1},{99,1,0},{114,1},{114,0},{122,0},{122,1},{99,2,1},{99,1,0},{114,1},{114,0},{122,0},{122,1},{122,2},{99,3,1},{99,1,0},{103}}, cp = {[0]=1,2,3}, np = 0},[1] = {bc = {{101,0},{110},{108,5},{120,1},{122,0},{104,0},{101,1},{110},{108,11},{120,1},{122,1},{104,1},{101,2},{110},{108,17},{120,1},{122,2},{104,2},{127,1},{101,0},{101,1},{100,18},{101,2},{100,18},{109,1},{109,0}}, cp = {[0]=10,20,30}, np = 3}}
local _bcbMUcwRHi = {[1]=function(a,b) return a >= b end,[2]=function(a,b) return a ~= b end,[3]=function(a,b) return a - b end,[4]=function(a,b) return a > b end,[5]=function(a,b) return a and b end,[6]=function(a,b) return a == b end,[7]=function(a,b) return a % b end,[8]=function(a,b) return a * b end,[9]=function(a,b) return bit32.bor(a, b) end,[10]=function(a,b) return a / b end,[11]=function(a,b) return tostring(a) .. tostring(b) end,[12]=function(a,b) return bit32.rshift(a, b) end,[13]=function(a,b) return bit32.band(a, b) end,[14]=function(a,b) return a ^ b end,[15]=function(a,b) return a <= b end,[16]=function(a,b) return a < b end,[17]=function(a,b) return a or b end,[18]=function(a,b) return a + b end,[19]=function(a,b) return bit32.lshift(a, b) end,[20]=function(a,b) return a // b end}
local _un2ZrEUrgL = {[1]=function(a) return bit32.bnot(a) end,[2]=function(a) return #a end,[3]=function(a) return -a end,[4]=function(a) return not a end}
local _en4Ro7xLXr = {}
for _i = 0, 1 do local _n = _nmpcs7NzLm[_i]; if _n ~= nil then _en4Ro7xLXr[_n] = _G[_n] end end
local function _rslvrhEdzlW4(key)
  if _en4Ro7xLXr[key] == nil and key ~= "nil" then
    _en4Ro7xLXr[key] = _G[key]
  end
  return _en4Ro7xLXr[key]
end
local _vmV299OSZz
local function _h664681(_st7hL1JI8Y, instr, ctx)
  local t=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]
      for i=1,#_st7hL1JI8Y.varargs do t[#t+1]=_st7hL1JI8Y.varargs[i] end
end
local function _h514640(_st7hL1JI8Y, instr, ctx)
  local t=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp-1]; local val=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; t[#t+1]=val
end
local function _h617581(_st7hL1JI8Y, instr, ctx)
  local idx=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; local obj=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=obj[idx]
end
local function _h449526(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=#_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]
end
local function _h732436(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.pc=instr[2]
end
local function _h901178(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=_en4Ro7xLXr[_nmpcs7NzLm[instr[2]]]
end
local function _h842721(_st7hL1JI8Y, instr, ctx)
  local v=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1
      if v then _st7hL1JI8Y.pc=instr[2] end
end
local function _h510588(_st7hL1JI8Y, instr, ctx)
  for i=1,#_st7hL1JI8Y.varargs do _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=_st7hL1JI8Y.varargs[i] end
end
local function _h842969(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=_st7hL1JI8Y.locals[instr[2]]
end
local function _h831930(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp-1]
end
local function _h204213(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-instr[2]
end
local function _h904002(_st7hL1JI8Y, instr, ctx)
  local val=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; local idx=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; local obj=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; obj[idx]=val
end
local function _h631363(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=_un2ZrEUrgL[instr[2]](_st7hL1JI8Y.stack[_st7hL1JI8Y.sp])
end
local function _h191239(_st7hL1JI8Y, instr, ctx)
  local v=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1
      if not v then _st7hL1JI8Y.pc=instr[2] end
end
local function _h556319(_st7hL1JI8Y, instr, ctx)
  local b=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; local a=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=_bcbMUcwRHi[instr[2]](a,b)
end
local function _h457935(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]={}
end
local function _h495871(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.halt=true
end
local function _h322508(_st7hL1JI8Y, instr, ctx)
  local _idx=instr[2]; _st7hL1JI8Y.locals[_idx]=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1
end
local function _h801146(_st7hL1JI8Y, instr, ctx)
  local nret=instr[2]
      local rets={}
      for i=nret,1,-1 do
        rets[i]=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]
        _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1
      end
      _st7hL1JI8Y.ret=rets
end
local function _h255175(_st7hL1JI8Y, instr, ctx)
  local nargs=instr[2]
      local nresults=instr[3] or 1
      local fn=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp-nargs+i] end
      _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs))}
      for i=1,nresults do _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=rets[i] end
end
local function _h931543(_st7hL1JI8Y, instr, ctx)
end
local function _h700585(_st7hL1JI8Y, instr, ctx)
end
local function _h480956(_st7hL1JI8Y, instr, ctx)
  local b=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; local a=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=tostring(a)..tostring(b)
end
local function _h661576(_st7hL1JI8Y, instr, ctx)
  local obj=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; local val=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1; obj[_dec10OZyD7i(_cpls67yhhABQ[ctx.pIdx or 0][_cpls67yhhABQ[ctx.pIdx or 0].__d[instr[2]]][_cpls67yhhABQ[ctx.pIdx or 0].__s[instr[2]]])]=val
end
local function _h590651(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1
      local _pi=instr[2]
      local _vmf=_vmV299OSZz
      _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=function(...)
        local _args={...}
        local _rets={_vmf(_pi,_en4Ro7xLXr,_args)}
        if #_rets>0 then return table.unpack(_rets) end
        return nil
      end
end
local function _h863673(_st7hL1JI8Y, instr, ctx)
  _en4Ro7xLXr[_nmpcs7NzLm[instr[2]]]=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]; _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1
end
local function _h769786(_st7hL1JI8Y, instr, ctx)
  local nargs=instr[2]
      local nresults=instr[3] or 1
      local methodName=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp]
      _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-1
      local obj=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp-nargs]
      local fn=obj[methodName]
      local callArgs={obj}
      for i=1,nargs do callArgs[i+1]=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp-nargs+i] end
      _st7hL1JI8Y.sp=_st7hL1JI8Y.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs+1))}
      for i=1,nresults do _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=rets[i] end
end
local function _h639673(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=nil
end
local function _h749240(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.sp=_st7hL1JI8Y.sp+1; _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=_dec10OZyD7i(_cpls67yhhABQ[ctx.pIdx or 0][_cpls67yhhABQ[ctx.pIdx or 0].__d[instr[2]]][_cpls67yhhABQ[ctx.pIdx or 0].__s[instr[2]]])
end
local function _h323042(_st7hL1JI8Y, instr, ctx)
  _st7hL1JI8Y.stack[_st7hL1JI8Y.sp]=_st7hL1JI8Y.stack[_st7hL1JI8Y.sp][_dec10OZyD7i(_cpls67yhhABQ[ctx.pIdx or 0][_cpls67yhhABQ[ctx.pIdx or 0].__d[instr[2]]][_cpls67yhhABQ[ctx.pIdx or 0].__s[instr[2]]])]
end
local _hdmefcf4pe = {}
_hdmefcf4pe[111] = _h664681
_hdmefcf4pe[116] = _h514640
_hdmefcf4pe[125] = _h617581
_hdmefcf4pe[96] = _h449526
_hdmefcf4pe[115] = _h732436
_hdmefcf4pe[114] = _h901178
_hdmefcf4pe[108] = _h842721
_hdmefcf4pe[107] = _h510588
_hdmefcf4pe[101] = _h842969
_hdmefcf4pe[110] = _h831930
_hdmefcf4pe[120] = _h204213
_hdmefcf4pe[102] = _h904002
_hdmefcf4pe[113] = _h631363
_hdmefcf4pe[118] = _h191239
_hdmefcf4pe[100] = _h556319
_hdmefcf4pe[123] = _h457935
_hdmefcf4pe[103] = _h495871
_hdmefcf4pe[104] = _h322508
_hdmefcf4pe[109] = _h801146
_hdmefcf4pe[99] = _h255175
_hdmefcf4pe[127] = _h931543
_hdmefcf4pe[121] = _h700585
_hdmefcf4pe[112] = _h480956
_hdmefcf4pe[106] = _h661576
_hdmefcf4pe[124] = _h590651
_hdmefcf4pe[105] = _h863673
_hdmefcf4pe[119] = _h769786
_hdmefcf4pe[98] = _h639673
_hdmefcf4pe[122] = _h749240
_hdmefcf4pe[117] = _h323042
_vmV299OSZz = function(protoIdx, _en4Ro7xLXr, args)
  local proto = _ps0KlLG0vg[protoIdx]
  local bc = proto.bc
  local _st7hL1JI8Y = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do _st7hL1JI8Y.locals[i-1]=_st7hL1JI8Y.varargs[i] end
  while true do
    local instr = bc[_st7hL1JI8Y.pc + 1]
    if instr == nil then break end
    _st7hL1JI8Y.pc = _st7hL1JI8Y.pc + 1
    _st7hL1JI8Y.ret = nil
    local op = instr[1]
    local handler = _hdmefcf4pe[op]
    if handler == nil then break end
    handler(_st7hL1JI8Y, instr, {pIdx=protoIdx})
    if _st7hL1JI8Y.halt then break end
    if _st7hL1JI8Y.ret then return table.unpack(_st7hL1JI8Y.ret) end
  end
  return nil
end
_vmV299OSZz(0, _en4Ro7xLXr, {})
