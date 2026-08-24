if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutf4perhEd={};for _i=0,255 do _lutf4perhEd[_i]=bit32.bxor(_i,11) end;local _dczlW467yh={};local function _dechABQcvjO(v)
  local c=_dczlW467yh[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutf4perhEd[v[i]])end;return s end)
  if ok then _dczlW467yh[v]=r;return r end
  return v
end
local _psuWDbF0Kl = {[0] = {bc = {{11,1},{19,0},{26,1},{26,0},{17,0,1},{17,1,0},{26,1},{26,0},{3,0},{17,1,1},{17,1,0},{26,1},{26,0},{3,0},{3,1},{17,2,1},{17,1,0},{26,1},{26,0},{3,0},{3,1},{3,2},{17,3,1},{17,1,0},{12}}, cp = {[0]=1,2,3}, np = 0},[1] = {bc = {{6,0},{18},{4,5},{13,1},{3,0},{7,0},{6,1},{18},{4,11},{13,1},{3,1},{7,1},{6,2},{18},{4,17},{13,1},{3,2},{7,2},{10,1},{6,0},{6,1},{20,14},{6,2},{20,14},{21,1},{21,0}}, cp = {[0]=10,20,30}, np = 3}}
local _nm1JI8Ypcs_r={[0]={84,63,111,102},{123,121,98,101,127}};local _nm1JI8Ypcs={};setmetatable(_nm1JI8Ypcs,{__index=function(_,k)
  local v=rawget(_nm1JI8Ypcs_r,k);local d=_dechABQcvjO(v);rawset(_nm1JI8Ypcs,k,d);return d
end})
local _romLG0vgmef = {[14]=1,[3]=2,[26]=3,[19]=4,[6]=5,[7]=6,[13]=7,[18]=8,[17]=9,[27]=10,[21]=11,[16]=12,[28]=13,[4]=14,[29]=15,[15]=16,[30]=17,[23]=18,[20]=19,[24]=20,[25]=21,[8]=22,[2]=23,[5]=24,[11]=25,[10]=26,[9]=27,[1]=28,[12]=29,[22]=30}
local _bc7NzLmbMU = {[1]=function(a,b) return a <= b end,[2]=function(a,b) return a > b end,[3]=function(a,b) return bit32.bor(a, b) end,[4]=function(a,b) return tostring(a) .. tostring(b) end,[5]=function(a,b) return a % b end,[6]=function(a,b) return a - b end,[7]=function(a,b) return a < b end,[8]=function(a,b) return a and b end,[9]=function(a,b) return a ^ b end,[10]=function(a,b) return a / b end,[11]=function(a,b) return bit32.lshift(a, b) end,[12]=function(a,b) return a == b end,[13]=function(a,b) return a >= b end,[14]=function(a,b) return a + b end,[15]=function(a,b) return a or b end,[16]=function(a,b) return bit32.rshift(a, b) end,[17]=function(a,b) return a // b end,[18]=function(a,b) return a ~= b end,[19]=function(a,b) return bit32.band(a, b) end,[20]=function(a,b) return a * b end}
local _uncwRHi2Zr = {[1]=function(a) return -a end,[2]=function(a) return not a end,[3]=function(a) return #a end,[4]=function(a) return bit32.bnot(a) end}
local _enEUrgL4Ro = {}
for _i = 0, 1 do local _n = _nm1JI8Ypcs[_i]; if _n ~= nil then _enEUrgL4Ro[_n] = _G[_n] end end
local function _vmpOKUsV29(protoIdx, _enEUrgL4Ro, args)
  local proto = _psuWDbF0Kl[protoIdx]
  local bc = proto.bc
  local _cp7xLXr16e = proto.cp
  local _st9OSZz7hL = {sp = -1, pc = 0, stack = {}, locals = {}, varargs = args or {}, halt = false, ret = nil}
  for i = 1, proto.np or 0 do _st9OSZz7hL.locals[i - 1] = _st9OSZz7hL.varargs[i] end
  while true do
    local instr = bc[_st9OSZz7hL.pc + 1]
    _st9OSZz7hL.pc = _st9OSZz7hL.pc + 1
     if instr == nil then break end
    _st9OSZz7hL.ret = nil
    local op = _romLG0vgmef[instr[1]] or instr[1]
    if op == 30 then
      local t=_st9OSZz7hL.stack[_st9OSZz7hL.sp]
            for i=1,#_st9OSZz7hL.varargs do t[#t+1]=_st9OSZz7hL.varargs[i] end
    elseif op == 17 then
      local b=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; local a=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=tostring(a)..tostring(b)
    elseif op == 19 then
      local b=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; local a=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=_bc7NzLmbMU[instr[2]](a,b)
    elseif op == 4 then
      _enEUrgL4Ro[_nm1JI8Ypcs[instr[2]]]=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1
    elseif op == 8 then
      _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=_st9OSZz7hL.stack[_st9OSZz7hL.sp-1]
    elseif op == 3 then
      _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=_enEUrgL4Ro[_nm1JI8Ypcs[instr[2]]]
    elseif op == 9 then
      local nargs=instr[2]
            local nresults=instr[3] or 1
            local fn=_st9OSZz7hL.stack[_st9OSZz7hL.sp-nargs]
            local callArgs={}
            for i=1,nargs do callArgs[i]=_st9OSZz7hL.stack[_st9OSZz7hL.sp-nargs+i] end
            _st9OSZz7hL.sp=_st9OSZz7hL.sp-nargs-1
            local rets={fn(table.unpack(callArgs,1,nargs))}
            for i=1,nresults do _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=rets[i] end
    elseif op == 1 then
    elseif op == 29 then
      _st9OSZz7hL.halt=true
    elseif op == 2 then
      _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=_dechABQcvjO(_cp7xLXr16e[instr[2]])
    elseif op == 18 then
      _st9OSZz7hL.stack[_st9OSZz7hL.sp]=#_st9OSZz7hL.stack[_st9OSZz7hL.sp]
    elseif op == 22 then
      local obj=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; local val=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; obj[_dechABQcvjO(_cp7xLXr16e[instr[2]])]=val
    elseif op == 6 then
      local _idx=instr[2]; _st9OSZz7hL.locals[_idx]=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1
    elseif op == 12 then
      _st9OSZz7hL.pc=instr[2]
    elseif op == 24 then
      local val=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; local idx=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; local obj=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; obj[idx]=val
    elseif op == 28 then
      _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=nil
    elseif op == 23 then
      local idx=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; local obj=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=obj[idx]
    elseif op == 11 then
      local nret=instr[2]
            local rets={}
            for i=nret,1,-1 do
              rets[i]=_st9OSZz7hL.stack[_st9OSZz7hL.sp]
              _st9OSZz7hL.sp=_st9OSZz7hL.sp-1
            end
            _st9OSZz7hL.ret=rets
    elseif op == 20 then
      _st9OSZz7hL.stack[_st9OSZz7hL.sp]=_uncwRHi2Zr[instr[2]](_st9OSZz7hL.stack[_st9OSZz7hL.sp])
    elseif op == 26 then
    elseif op == 10 then
      local nargs=instr[2]
            local nresults=instr[3] or 1
            local methodName=_st9OSZz7hL.stack[_st9OSZz7hL.sp]
            _st9OSZz7hL.sp=_st9OSZz7hL.sp-1
            local obj=_st9OSZz7hL.stack[_st9OSZz7hL.sp-nargs]
            local fn=obj[methodName]
            local callArgs={obj}
            for i=1,nargs do callArgs[i+1]=_st9OSZz7hL.stack[_st9OSZz7hL.sp-nargs+i] end
            _st9OSZz7hL.sp=_st9OSZz7hL.sp-nargs-1
            local rets={fn(table.unpack(callArgs,1,nargs+1))}
            for i=1,nresults do _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=rets[i] end
    elseif op == 13 then
      local v=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1
            if not v then _st9OSZz7hL.pc=instr[2] end
    elseif op == 15 then
      _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]={}
    elseif op == 21 then
      _st9OSZz7hL.stack[_st9OSZz7hL.sp]=_st9OSZz7hL.stack[_st9OSZz7hL.sp][_dechABQcvjO(_cp7xLXr16e[instr[2]])]
    elseif op == 5 then
      _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=_st9OSZz7hL.locals[instr[2]]
    elseif op == 16 then
      local t=_st9OSZz7hL.stack[_st9OSZz7hL.sp-1]; local val=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1; t[#t+1]=val
    elseif op == 25 then
      _st9OSZz7hL.sp=_st9OSZz7hL.sp+1
            local _pi=instr[2]
            local _vmf=_vmpOKUsV29
            _st9OSZz7hL.stack[_st9OSZz7hL.sp]=function(...)
              local _args={...}
              local _rets={_vmf(_pi,_enEUrgL4Ro,_args)}
              if #_rets>0 then return table.unpack(_rets) end
              return nil
            end
    elseif op == 14 then
      local v=_st9OSZz7hL.stack[_st9OSZz7hL.sp]; _st9OSZz7hL.sp=_st9OSZz7hL.sp-1
            if v then _st9OSZz7hL.pc=instr[2] end
    elseif op == 7 then
      _st9OSZz7hL.sp=_st9OSZz7hL.sp-instr[2]
    elseif op == 27 then
      for i=1,#_st9OSZz7hL.varargs do _st9OSZz7hL.sp=_st9OSZz7hL.sp+1; _st9OSZz7hL.stack[_st9OSZz7hL.sp]=_st9OSZz7hL.varargs[i] end
    end
    if _st9OSZz7hL.halt then break end
    if _st9OSZz7hL.ret then return table.unpack(_st9OSZz7hL.ret) end
  end
  return nil
end
_vmpOKUsV29(0, _enEUrgL4Ro, {})
