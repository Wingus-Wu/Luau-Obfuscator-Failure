if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutNwkTKsMC={};for _i=0,255 do _lutNwkTKsMC[_i]=bit32.bxor(_i,242) end;local _dcJyR3ZCZY={};local function _dech3KgFyBp(v)
  local c=_dcJyR3ZCZY[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutNwkTKsMC[v[i]])end;return s end)
  if ok then _dcJyR3ZCZY[v]=r;return r end
  return v
end
local _nmL4Ro7xLX_r={[0]={173,198,150,159},{130,128,155,156,134}};local _nmL4Ro7xLX={};setmetatable(_nmL4Ro7xLX,{__index=function(_,k)
  local v=rawget(_nmL4Ro7xLX_r,k);local d=_dech3KgFyBp(v);rawset(_nmL4Ro7xLX,k,d);return d
end})
local _cplYL10OZyD = {}
_cplYL10OZyD[0] = {[0]=1,3,2}
_cplYL10OZyD[0].__r = {[0]=0,2,1}
_cplYL10OZyD[1] = {[0]=30,20,10}
_cplYL10OZyD[1].__r = {[0]=2,1,0}
local _cdc7iQd7wh8 = {}
local function _cld2SclyHue(idx, pIdx)
  if pIdx == nil then pIdx = 0 end
  local key = pIdx * 100003 + idx
  if _cdc7iQd7wh8[key] ~= nil then return _cdc7iQd7wh8[key] end
  local pools = _cplYL10OZyD[pIdx]
  local val = pools[pools.__r[idx]]
  _cdc7iQd7wh8[key] = val
  return val
end
local _ps467yhhAB = {[0] = {bc = {{10,1},{22,0},{12,1},{12,0},{20,0,1},{20,1,0},{12,1},{12,0},{6,0},{20,1,1},{20,1,0},{12,1},{12,0},{6,0},{6,1},{20,2,1},{20,1,0},{12,1},{12,0},{6,0},{6,1},{6,2},{20,3,1},{20,1,0},{30}}, cp = {[0]=1,2,3}, np = 0},[1] = {bc = {{18,0},{27},{14,5},{7,1},{6,0},{19,0},{18,1},{27},{14,11},{7,1},{6,1},{19,1},{18,2},{27},{14,17},{7,1},{6,2},{19,2},{25,1},{18,0},{18,1},{21,13},{18,2},{21,13},{2,1},{2,0}}, cp = {[0]=10,20,30}, np = 3}}
local _bcr16e38z8 = {[1]=function(a,b) return bit32.band(a, b) end,[2]=function(a,b) return bit32.bor(a, b) end,[3]=function(a,b) return a > b end,[4]=function(a,b) return a < b end,[5]=function(a,b) return a - b end,[6]=function(a,b) return a % b end,[7]=function(a,b) return tostring(a) .. tostring(b) end,[8]=function(a,b) return a // b end,[9]=function(a,b) return a / b end,[10]=function(a,b) return a >= b end,[11]=function(a,b) return a == b end,[12]=function(a,b) return a <= b end,[13]=function(a,b) return a + b end,[14]=function(a,b) return a and b end,[15]=function(a,b) return bit32.lshift(a, b) end,[16]=function(a,b) return bit32.rshift(a, b) end,[17]=function(a,b) return a ~= b end,[18]=function(a,b) return a or b end,[19]=function(a,b) return a * b end,[20]=function(a,b) return a ^ b end}
local _unveuruWDb = {[1]=function(a) return -a end,[2]=function(a) return not a end,[3]=function(a) return bit32.bnot(a) end,[4]=function(a) return #a end}
local _rm3Q2MeISD = {[1]=1,[6]=2,[12]=3,[22]=4,[18]=5,[19]=6,[7]=7,[27]=8,[20]=9,[29]=10,[2]=11,[16]=12,[24]=13,[14]=14,[9]=15,[23]=16,[8]=17,[26]=18,[21]=19,[28]=20,[3]=21,[4]=22,[5]=23,[13]=24,[10]=25,[25]=26,[11]=27,[17]=28,[30]=29,[15]=30}
local _enF0KlLG0v = {}
for _i = 0, 1 do local _n = _nmL4Ro7xLX[_i]; if _n ~= nil then _enF0KlLG0v[_n] = _G[_n] end end
local function _rslv3Mm0NICU(key)
  if _enF0KlLG0v[key] == nil then
    _enF0KlLG0v[key] = _G[key]
  end
  return _enF0KlLG0v[key]
end
local _vmmbMUcwRH
local function _h750366(_sti2ZrEUrg, instr, ctx)
  local nargs=instr[2]
      local nresults=instr[3] or 1
      local fn=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp-nargs+i] end
      _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs))}
      for i=1,nresults do _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=rets[i] end
end
local function _h393175(_sti2ZrEUrg, instr, ctx)
  _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-instr[2]
end
local function _h105574(_sti2ZrEUrg, instr, ctx)
  for i=1,#_sti2ZrEUrg.varargs do _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=_sti2ZrEUrg.varargs[i] end
end
local function _h300423(_sti2ZrEUrg, instr, ctx)
  local idx=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; local obj=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=obj[idx]
end
local function _h295326(_sti2ZrEUrg, instr, ctx)
  _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp-1]
end
local function _h106998(_sti2ZrEUrg, instr, ctx)
  local t=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]
      for i=1,#_sti2ZrEUrg.varargs do t[#t+1]=_sti2ZrEUrg.varargs[i] end
end
local function _h863293(_sti2ZrEUrg, instr, ctx)
  _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]={}
end
local function _h196750(_sti2ZrEUrg, instr, ctx)
  local v=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1
      if v then _sti2ZrEUrg.pc=instr[2] end
end
local function _h324834(_sti2ZrEUrg, instr, ctx)
  local b=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; local a=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=_bcr16e38z8[instr[2]](a,b)
end
local function _h995226(_sti2ZrEUrg, instr, ctx)
  local val=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; local idx=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; local obj=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; obj[idx]=val
end
local _hdQcvjO2nC = {}
_hdQcvjO2nC[9] = _h750366
_hdQcvjO2nC[7] = _h393175
_hdQcvjO2nC[27] = _h105574
_hdQcvjO2nC[23] = _h300423
_hdQcvjO2nC[8] = _h295326
_hdQcvjO2nC[30] = _h106998
_hdQcvjO2nC[15] = _h863293
_hdQcvjO2nC[14] = _h196750
_hdQcvjO2nC[19] = _h324834
_hdQcvjO2nC[24] = _h995226
_vmmbMUcwRH = function(protoIdx, _enF0KlLG0v, args)
  local proto = _ps467yhhAB[protoIdx]
  local bc = proto.bc
  local _sti2ZrEUrg = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do _sti2ZrEUrg.locals[i-1]=_sti2ZrEUrg.varargs[i] end
  while true do
    local instr = bc[_sti2ZrEUrg.pc + 1]
    if instr == nil then break end
    _sti2ZrEUrg.pc = _sti2ZrEUrg.pc + 1
    _sti2ZrEUrg.ret = nil
    local op = _rm3Q2MeISD[instr[1]] or instr[1]
    if op == 1 then
    elseif op == 11 then
      local nret=instr[2]
            local rets={}
            for i=nret,1,-1 do
              rets[i]=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]
              _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1
            end
            _sti2ZrEUrg.ret=rets
    elseif op == 28 then
      _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=nil
    elseif op == 29 then
      _sti2ZrEUrg.halt=true
    elseif op == 10 then
      local nargs=instr[2]
            local nresults=instr[3] or 1
            local methodName=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]
            _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1
            local obj=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp-nargs]
            local fn=obj[methodName]
            local callArgs={obj}
            for i=1,nargs do callArgs[i+1]=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp-nargs+i] end
            _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-nargs-1
            local rets={fn(table.unpack(callArgs,1,nargs+1))}
            for i=1,nresults do _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=rets[i] end
    elseif op == 21 then
      _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp][_dech3KgFyBp(_cld2SclyHue(instr[2], protoIdx))]
    elseif op == 4 then
      _enF0KlLG0v[_nmL4Ro7xLX[instr[2]]]=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1
    elseif op == 2 then
      _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=_dech3KgFyBp(_cld2SclyHue(instr[2], protoIdx))
    elseif op == 22 then
      local obj=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; local val=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; obj[_dech3KgFyBp(_cld2SclyHue(instr[2], protoIdx))]=val
    elseif op == 3 then
      _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=_enF0KlLG0v[_nmL4Ro7xLX[instr[2]]]
    elseif op == 18 then
      _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=#_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]
    elseif op == 25 then
      _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1
            local _pi=instr[2]
            local _vmf=_vmmbMUcwRH
            _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=function(...)
              local _args={...}
              local _rets={_vmf(_pi,_enF0KlLG0v,_args)}
              if #_rets>0 then return table.unpack(_rets) end
              return nil
            end
    elseif op == 5 then
      _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=_sti2ZrEUrg.locals[instr[2]]
    elseif op == 13 then
      local v=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1
            if not v then _sti2ZrEUrg.pc=instr[2] end
    elseif op == 17 then
      local b=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; local a=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp+1; _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=tostring(a)..tostring(b)
    elseif op == 20 then
      _sti2ZrEUrg.stack[_sti2ZrEUrg.sp]=_unveuruWDb[instr[2]](_sti2ZrEUrg.stack[_sti2ZrEUrg.sp])
    elseif op == 16 then
      local t=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp-1]; local val=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1; t[#t+1]=val
    elseif op == 12 then
      _sti2ZrEUrg.pc=instr[2]
    elseif op == 26 then
    elseif op == 6 then
      local _idx=instr[2]; _sti2ZrEUrg.locals[_idx]=_sti2ZrEUrg.stack[_sti2ZrEUrg.sp]; _sti2ZrEUrg.sp=_sti2ZrEUrg.sp-1
    end
    local handler = _hdQcvjO2nC[op]
    if handler then handler(_sti2ZrEUrg, instr, {pIdx=protoIdx}) end
    if _sti2ZrEUrg.halt then break end
    if _sti2ZrEUrg.ret then return table.unpack(_sti2ZrEUrg.ret) end
  end
  return nil
end
_vmmbMUcwRH(0, _enF0KlLG0v, {})
