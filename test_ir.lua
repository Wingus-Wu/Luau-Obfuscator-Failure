if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _luteISD6Nwk={};for _i=0,255 do _luteISD6Nwk[_i]=bit32.bxor(_i,159) end;local _dcTKsMCJyR={};local function _dec3ZCZYh3K(v)
  local c=_dcTKsMCJyR[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_luteISD6Nwk[v[i]])end;return s end)
  if ok then _dcTKsMCJyR[v]=r;return r end
  return v
end
local _nmrEUrgL4R_r={[0]={235,254,253,243,250},{192,171,251,242},{246,239,254,246,237,236},{239,237,246,241,235}};local _nmrEUrgL4R={};setmetatable(_nmrEUrgL4R,{__index=function(_,k)
  local v=rawget(_nmrEUrgL4R_r,k);local d=_dec3ZCZYh3K(v);rawset(_nmrEUrgL4R,k,d);return d
end})
local _psEdzlW467 = {[0] = {bc = {{69,1},{59,1},{76},{53,0},{68},{53,1},{68},{53,2},{68},{58,0},{78,1},{62,0},{70,1,1},{58,1},{78,2},{62,1},{70,1,3},{58,4},{58,3},{58,2},{62,2},{62,3},{62,4},{70,2,2},{58,5},{58,4},{62,4},{64,40},{78,3},{53,3},{78,0},{66,4},{62,5},{53,5},{70,2,1},{73,4},{53,6},{73,4},{70,1,0},{77,20},{52}}, cp = {[0]=1,2,3,{228,191},{252,240,241,252,254,235},{179,191},{191,226}}, np = 0},[1] = {bc = {{62,1},{74},{61,5},{54,1},{53,0},{58,1},{62,2},{74},{61,11},{54,1},{76},{58,2},{62,3},{74},{61,17},{54,1},{76},{58,3},{62,1},{62,0},{56,3},{73,9},{64,36},{78,0},{66,1},{62,3},{76},{78,0},{66,2},{62,2},{70,1,1},{68},{70,2,0},{60,2},{62,3},{72,1},{78,1},{62,0},{62,1},{53,0},{73,18},{62,2},{62,3},{70,4,0},{78,0},{66,1},{62,2},{62,0},{62,1},{65},{70,2,0},{78,1},{62,0},{62,1},{53,0},{73,18},{62,2},{62,3},{70,4,0},{78,0},{66,3},{62,2},{70,1,0},{60,1},{62,3},{72,1},{72,0}}, cp = {[0]=1,{246,241,236,250,237,235},{234,241,239,254,252,244},{237,250,242,240,233,250}}, np = 4}}
local _bco7xLXr16 = {[1]=function(a,b) return a < b end,[2]=function(a,b) return a >= b end,[3]=function(a,b) return bit32.rshift(a, b) end,[4]=function(a,b) return tostring(a) .. tostring(b) end,[5]=function(a,b) return a // b end,[6]=function(a,b) return a <= b end,[7]=function(a,b) return a / b end,[8]=function(a,b) return bit32.lshift(a, b) end,[9]=function(a,b) return a > b end,[10]=function(a,b) return a and b end,[11]=function(a,b) return bit32.bor(a, b) end,[12]=function(a,b) return a % b end,[13]=function(a,b) return a - b end,[14]=function(a,b) return a * b end,[15]=function(a,b) return bit32.band(a, b) end,[16]=function(a,b) return a == b end,[17]=function(a,b) return a ^ b end,[18]=function(a,b) return a + b end,[19]=function(a,b) return a ~= b end,[20]=function(a,b) return a or b end}
local _une38z8veu = {[1]=function(a) return -a end,[2]=function(a) return not a end,[3]=function(a) return #a end,[4]=function(a) return bit32.bnot(a) end}
local _rmd7wh82Sc = {[75]=1,[53]=2,[78]=3,[59]=4,[62]=5,[58]=6,[54]=7,[74]=8,[70]=9,[79]=10,[72]=11,[77]=12,[64]=13,[61]=14,[76]=15,[68]=16,[67]=17,[71]=18,[73]=19,[56]=20,[66]=21,[63]=22,[65]=23,[57]=24,[69]=25,[60]=26,[55]=27,[80]=28,[52]=29,[51]=30}
local _cpjO2nC3Mm = {}
_cpjO2nC3Mm[0] = {[0]=1,2,3,{228,191},{252,240,241,252,254,235},{179,191},{191,226}}
_cpjO2nC3Mm[1] = {[0]=1,{246,241,236,250,237,235},{234,241,239,254,252,244},{237,250,242,240,233,250}}
local _cc0NICUYL1 = {}
local function _cl0OZyD7iQ(idx, pIdx)
  if pIdx == nil then pIdx = 0 end
  local key = pIdx * 100003 + idx
  if _cc0NICUYL1[key] ~= nil then return _cc0NICUYL1[key] end
  local val = _cpjO2nC3Mm[pIdx][idx]
  _cc0NICUYL1[key] = val
  return val
end
local _enruWDbF0K = {}
for _i = 0, 3 do local _n = _nmrEUrgL4R[_i]; if _n ~= nil then _enruWDbF0K[_n] = _G[_n] end end
local function _rslvyhhABQcv(key)
  if _enruWDbF0K[key] == nil then
    _enruWDbF0K[key] = _G[key]
  end
  return _enruWDbF0K[key]
end
local _band44YKnLot = {[1]=3,[2]=1,[3]=0,[4]=1,[5]=3,[6]=2,[7]=1,[8]=1,[9]=0,[10]=3,[11]=2,[12]=3,[13]=3,[14]=0,[15]=0,[16]=1,[17]=3,[18]=3,[19]=2,[20]=0,[21]=2,[22]=2,[23]=0,[24]=2,[25]=0,[26]=0,[27]=1,[28]=2,[29]=1,[30]=1}
local function _vms7NzLmbM(protoIdx, _enruWDbF0K, args)
  local proto = _psEdzlW467[protoIdx]
  local bc = proto.bc
  local _stUcwRHi2Z = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do _stUcwRHi2Z.locals[i-1]=_stUcwRHi2Z.varargs[i] end
  while true do
    local instr = bc[_stUcwRHi2Z.pc + 1]
    if instr == nil then break end
    _stUcwRHi2Z.pc = _stUcwRHi2Z.pc + 1
    _stUcwRHi2Z.ret = nil
    local op = _rmd7wh82Sc[instr[1]] or instr[1]
    _svlyHue3Q2 = _band44YKnLot[op]
    if _svlyHue3Q2 == 0 then
      if op == 26 then
      elseif op == 3 then
        _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=_enruWDbF0K[_nmrEUrgL4R[instr[2]]]
      elseif op == 14 then
        local v=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1
              if v then _stUcwRHi2Z.pc=instr[2] end
      elseif op == 23 then
        local idx=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; local obj=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=obj[idx]
      elseif op == 25 then
        _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1
              local _pi=instr[2]
              local _vmf=_vms7NzLmbM
              _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=function(...)
                local _args={...}
                local _rets={_vmf(_pi,_enruWDbF0K,_args)}
                if #_rets>0 then return table.unpack(_rets) end
                return nil
              end
      elseif op == 9 then
        local nargs=instr[2]
              local nresults=instr[3] or 1
              local fn=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp-nargs]
              local callArgs={}
              for i=1,nargs do callArgs[i]=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp-nargs+i] end
              _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-nargs-1
              local rets={fn(table.unpack(callArgs,1,nargs))}
              for i=1,nresults do _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=rets[i] end
      elseif op == 20 then
        _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=_une38z8veu[instr[2]](_stUcwRHi2Z.stack[_stUcwRHi2Z.sp])
      elseif op == 15 then
        _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]={}
      end
    elseif _svlyHue3Q2 == 1 then
      if op == 8 then
        _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp-1]
      elseif op == 2 then
        _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=_dec3ZCZYh3K(_cl0OZyD7iQ(instr[2], protoIdx))
      elseif op == 27 then
        for i=1,#_stUcwRHi2Z.varargs do _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=_stUcwRHi2Z.varargs[i] end
      elseif op == 30 then
        local t=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]
              for i=1,#_stUcwRHi2Z.varargs do t[#t+1]=_stUcwRHi2Z.varargs[i] end
      elseif op == 16 then
        local t=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp-1]; local val=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; t[#t+1]=val
      elseif op == 29 then
        _stUcwRHi2Z.halt=true
      elseif op == 7 then
        _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-instr[2]
      elseif op == 4 then
        _enruWDbF0K[_nmrEUrgL4R[instr[2]]]=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1
      end
    elseif _svlyHue3Q2 == 2 then
      if op == 6 then
        local _idx=instr[2]; _stUcwRHi2Z.locals[_idx]=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1
      elseif op == 21 then
        _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp][_dec3ZCZYh3K(_cl0OZyD7iQ(instr[2], protoIdx))]
      elseif op == 24 then
        local val=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; local idx=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; local obj=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; obj[idx]=val
      elseif op == 19 then
        local b=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; local a=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=_bco7xLXr16[instr[2]](a,b)
      elseif op == 11 then
        local nret=instr[2]
              local rets={}
              for i=nret,1,-1 do
                rets[i]=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]
                _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1
              end
              _stUcwRHi2Z.ret=rets
      elseif op == 22 then
        local obj=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; local val=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; obj[_dec3ZCZYh3K(_cl0OZyD7iQ(instr[2], protoIdx))]=val
      elseif op == 28 then
        _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=nil
      end
    elseif _svlyHue3Q2 == 3 then
      if op == 1 then
      elseif op == 17 then
        local b=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; local a=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=tostring(a)..tostring(b)
      elseif op == 18 then
        _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=#_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]
      elseif op == 10 then
        local nargs=instr[2]
              local nresults=instr[3] or 1
              local methodName=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]
              _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1
              local obj=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp-nargs]
              local fn=obj[methodName]
              local callArgs={obj}
              for i=1,nargs do callArgs[i+1]=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp-nargs+i] end
              _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-nargs-1
              local rets={fn(table.unpack(callArgs,1,nargs+1))}
              for i=1,nresults do _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=rets[i] end
      elseif op == 13 then
        local v=_stUcwRHi2Z.stack[_stUcwRHi2Z.sp]; _stUcwRHi2Z.sp=_stUcwRHi2Z.sp-1
              if not v then _stUcwRHi2Z.pc=instr[2] end
      elseif op == 5 then
        _stUcwRHi2Z.sp=_stUcwRHi2Z.sp+1; _stUcwRHi2Z.stack[_stUcwRHi2Z.sp]=_stUcwRHi2Z.locals[instr[2]]
      elseif op == 12 then
        _stUcwRHi2Z.pc=instr[2]
      end
    end
    if _stUcwRHi2Z.halt then break end
    if _stUcwRHi2Z.ret then return table.unpack(_stUcwRHi2Z.ret) end
  end
  return nil
end
_vms7NzLmbM(0, _enruWDbF0K, {})
