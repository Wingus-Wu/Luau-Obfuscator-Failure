local _sdxfabae_pool = {"\168\243","\255\243","\243\174"};
local _sp_k__sdxfabae={211,229,150,186,105,8,84,97,112,47,21,91,132,60,65,26,118,234,196,67,6,247,245,227}
local function _sp_xorfn__sdxfabae(a,b) local r,m=0,1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end a=math.floor(a/2) b=math.floor(b/2) m=m*2 end return r end
local _sp_cache__sdxfabae = {}
local function _sdxfabae(input)
  local _decoded = _sdxfabae_pool[input]
  if _decoded then input = _decoded end
  if _sp_cache__sdxfabae[input] then return _sp_cache__sdxfabae[input] end
  local n = #input
  local buf = {}
  for i = 1, n do
    local key_idx = math.ceil(i / 4)
    local _b = string.byte(input, i)
    buf[i] = string.char(_sp_xorfn__sdxfabae(_b, _sp_k__sdxfabae[key_idx]))
  end
  local result = table.concat(buf)
  _sp_cache__sdxfabae[input] = result
  return result
end
if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutosEZNApy={};for _i=0,255 do _lutosEZNApy[_i]=bit32.bxor(_i,89) end;local _dcRUxC9r8l={};local function _decT2aqGEXi(v)
  local c=_dcRUxC9r8l[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutosEZNApy[v[i]])end;return s end)
  if ok then _dcRUxC9r8l[v]=r;return r end
  return v
end
local _nmGH4QMljg_r={[0]={60,43,43,54,43},{6,47,60,43,48,63,32,6,107,96,110,104},{6,32,61,41,46},{6,50,35,51,59,48,49},{6,58,55,50,53,62},{45,56,59,53,60},{6,109,61,52},{59,48,45,106,107},{48,41,56,48,43,42},{41,43,48,55,45},{6,42,61,33,63,56,59,56,60},{42,45,43,48,55,62}};local _nmGH4QMljg={};setmetatable(_nmGH4QMljg,{__index=function(_,k)
  local v=rawget(_nmGH4QMljg_r,k);local d=_decT2aqGEXi(v);rawset(_nmGH4QMljg,k,d);return d
end})
local _psekh6lUCa = {[0] = {bc = {{21,1},{10,1},{21,2},{10,6},{8},{11,0},{36},{17,7},{23,1},{11,2},{11,3},{7,2,1},{36},{11,4},{11,5},{29,10},{36},{26,0},{17,6},{28,0},{7,1,1},{26,1},{17,8},{28,1},{7,1,3},{26,4},{26,3},{26,2},{28,2},{28,3},{28,4},{7,2,2},{26,5},{26,4},{28,4},{20,61},{17,9},{17,10},{11,0},{7,1,1},{17,5},{11,6},{22},{28,5},{17,10},{17,11},{11,7},{22},{11,8},{7,1,1},{7,1,1},{7,2,1},{29,17},{17,10},{11,9},{11,10},{29,13},{7,1,1},{29,17},{7,1,0},{9,28},{12}}, cp = {[0]=1,{59,56,55,61},2,4294967295,62,59,{58,54,55,58,56,45},{59,32,45,60},{91},15,5}, np = 0},[1] = {bc = {{11,0},{26,0},{11,1},{26,1},{28,1},{11,2},{29,8},{20,10},{11,3},{26,0},{28,0},{25,2},{20,16},{17,0},{11,4},{7,1,0},{14,1},{28,0},{30,1},{30,0}}, cp = {[0]=true,365015817,1892880665,false,{2,24,55,45,48,13,56,52,41,60,43,4,121,16,55,45,60,62,43,48,45,32,121,47,48,54,53,56,45,48,54,55,121,61,60,45,60,58,45,60,61}}, np = 0},[2] = {bc = {{11,0},{26,4},{11,1},{20,224},{28,4},{11,0},{29,7},{20,29},{17,2},{11,2},{29,11},{20,21},{11,3},{26,4},{11,4},{11,5},{29,13},{26,5},{11,6},{26,4},{9,29},{11,7},{26,4},{11,8},{11,9},{29,10},{26,6},{11,6},{26,4},{11,10},{26,7},{28,4},{11,6},{29,7},{20,56},{17,3},{11,11},{29,11},{20,48},{11,12},{26,4},{11,13},{11,14},{29,10},{26,8},{11,15},{26,4},{9,56},{11,16},{26,4},{11,17},{11,18},{29,15},{26,9},{11,15},{26,4},{11,19},{11,20},{29,15},{26,10},{11,21},{11,22},{29,13},{26,11},{11,23},{11,24},{29,10},{26,12},{11,25},{11,26},{29,10},{26,13},{11,27},{11,28},{29,13},{26,14},{11,29},{11,30},{29,15},{26,15},{11,31},{11,32},{29,10},{26,16},{11,33},{11,34},{29,10},{26,17},{11,35},{11,36},{29,13},{26,18},{28,4},{11,15},{29,7},{20,117},{17,4},{11,37},{29,11},{20,109},{11,38},{26,4},{11,39},{11,40},{29,10},{26,19},{11,41},{26,4},{9,117},{11,42},{26,4},{11,43},{11,44},{29,10},{26,20},{11,41},{26,4},{8},{11,45},{36},{11,18},{36},{11,46},{36},{26,21},{8},{11,47},{36},{26,22},{11,48},{11,49},{29,13},{26,23},{8},{11,50},{36},{26,24},{28,1},{16},{31,142},{15,1},{11,0},{26,1},{28,2},{16},{31,148},{15,1},{8},{26,2},{28,3},{16},{31,154},{15,1},{8},{26,3},{28,4},{11,41},{29,7},{20,187},{28,1},{28,0},{25,1},{29,11},{20,183},{11,51},{26,4},{17,5},{11,52},{22},{28,3},{8},{17,5},{23,53},{28,2},{7,1,1},{36},{7,2,0},{14,5},{28,3},{30,1},{11,54},{26,4},{9,187},{11,55},{26,4},{11,54},{26,4},{17,6},{28,0},{28,1},{11,0},{29,15},{28,2},{28,3},{7,4,0},{17,5},{11,52},{22},{28,2},{28,0},{28,1},{22},{7,2,0},{17,6},{28,0},{28,1},{11,0},{29,15},{28,2},{28,3},{7,4,0},{17,5},{11,56},{22},{28,2},{7,1,0},{28,4},{11,54},{29,7},{20,223},{14,4},{28,3},{30,1},{9,2},{30,0}}, cp = {[0]=1,true,571,2,635,407,4,3,707,535,{42,62,32,51,41,44,49,46,32,59},323,5,531,850,7,6,91,916,405,180,46,343,899,614,757,811,60,968,188,401,75,550,461,576,814,116,780,8,546,849,10,9,935,351,915,818,369,658,834,929,11,{48,55,42,60,43,45},{44,55,41,56,58,50},13,12,{43,60,52,54,47,60}}, np = 4}}
local _bcUfxLfRPS = {[1]=function(a,b) return a and b end,[2]=function(a,b) return a < b end,[3]=function(a,b) return a % b end,[4]=function(a,b) return a <= b end,[5]=function(a,b) return a >= b end,[6]=function(a,b) return bit32.band(a, b) end,[7]=function(a,b) return a == b end,[8]=function(a,b) return a ~= b end,[9]=function(a,b) return bit32.bor(a, b) end,[10]=function(a,b) return a - b end,[11]=function(a,b) return a > b end,[12]=function(a,b) return bit32.lshift(a, b) end,[13]=function(a,b) return a * b end,[14]=function(a,b) return a // b end,[15]=function(a,b) return a + b end,[16]=function(a,b) return a ^ b end,[17]=function(a,b) return tostring(a) .. tostring(b) end,[18]=function(a,b) return a or b end,[19]=function(a,b) return a / b end,[20]=function(a,b) return bit32.rshift(a, b) end}
local _un5GSwnlnF = {[1]=function(a) return #a end,[2]=function(a) return not a end,[3]=function(a) return bit32.bnot(a) end,[4]=function(a) return -a end}
local _rmtZGqf2CN = {[19]=1,[11]=2,[17]=3,[10]=4,[28]=5,[26]=6,[15]=7,[16]=8,[7]=9,[24]=10,[30]=11,[9]=12,[20]=13,[31]=14,[8]=15,[36]=16,[34]=17,[32]=18,[29]=19,[25]=20,[23]=21,[18]=22,[22]=23,[33]=24,[21]=25,[14]=26,[35]=27,[27]=28,[12]=29,[13]=30}
local _cp3U8PggrC = {}
_cp3U8PggrC[0] = {[0]=1,{59,56,55,61},2,4294967295,62,59,{58,54,55,58,56,45},{59,32,45,60},{91},15,5}
_cp3U8PggrC[1] = {[0]=true,365015817,1892880665,false,{2,24,55,45,48,13,56,52,41,60,43,4,121,16,55,45,60,62,43,48,45,32,121,47,48,54,53,56,45,48,54,55,121,61,60,45,60,58,45,60,61}}
_cp3U8PggrC[2] = {[0]=1,true,571,2,635,407,4,3,707,535,{42,62,32,51,41,44,49,46,32,59},323,5,531,850,7,6,91,916,405,180,46,343,899,614,757,811,60,968,188,401,75,550,461,576,814,116,780,8,546,849,10,9,935,351,915,818,369,658,834,929,11,{48,55,42,60,43,45},{44,55,41,56,58,50},13,12,{43,60,52,54,47,60}}
local _ccoD0Oaj44 = {}
local function _clQEk0VTZp(idx, pIdx)
  if pIdx == nil then pIdx = 0 end
  local key = pIdx * 100003 + idx
  if _ccoD0Oaj44[key] ~= nil then return _ccoD0Oaj44[key] end
  local val = _cp3U8PggrC[pIdx][idx]
  _ccoD0Oaj44[key] = val
  return val
end
local _envpNmpU0a = {}
for _i = 0, 11 do local _n = _nmGH4QMljg[_i]; if _n ~= nil then _envpNmpU0a[_n] = _G[_n] end end
_envpNmpU0a["_sdxfabae"] = _sdxfabae
local function _rslvtyUnbmLa(key)
  if _envpNmpU0a[key] == nil then
    _envpNmpU0a[key] = _G[key]
  end
  return _envpNmpU0a[key]
end
local _bandmZW9RhJi = {[1]=1,[2]=1,[3]=0,[4]=1,[5]=1,[6]=1,[7]=0,[8]=0,[9]=1,[10]=0,[11]=0,[12]=0,[13]=0,[14]=1,[15]=0,[16]=1,[17]=1,[18]=0,[19]=1,[20]=0,[21]=0,[22]=0,[23]=1,[24]=0,[25]=1,[26]=0,[27]=1,[28]=1,[29]=0,[30]=1}
local function _vmsqpDBYhf(protoIdx, _envpNmpU0a, args)
  local proto = _psekh6lUCa[protoIdx]
  local bc = proto.bc
  local _stmNxTSmVX = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do _stmNxTSmVX.locals[i-1]=_stmNxTSmVX.varargs[i] end
  while true do
    local instr = bc[_stmNxTSmVX.pc + 1]
    if instr == nil then break end
    _stmNxTSmVX.pc = _stmNxTSmVX.pc + 1
    _stmNxTSmVX.ret = nil
    local op = _rmtZGqf2CN[instr[1]] or instr[1]
    _svHAokmWPU = _bandmZW9RhJi[op]
    if _svHAokmWPU == 0 then
      if op == 18 then
        _stmNxTSmVX.stack[_stmNxTSmVX.sp]=#_stmNxTSmVX.stack[_stmNxTSmVX.sp]
      elseif op == 15 then
        _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]={}
      elseif op == 21 then
        _stmNxTSmVX.stack[_stmNxTSmVX.sp]=_stmNxTSmVX.stack[_stmNxTSmVX.sp][_decT2aqGEXi(_clQEk0VTZp(instr[2], protoIdx))]
      elseif op == 3 then
        _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=_envpNmpU0a[_nmGH4QMljg[instr[2]]]
      elseif op == 13 then
        local v=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1
              if not v then _stmNxTSmVX.pc=instr[2] end
      elseif op == 8 then
        _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=_stmNxTSmVX.stack[_stmNxTSmVX.sp-1]
      elseif op == 12 then
        _stmNxTSmVX.pc=instr[2]
      elseif op == 10 then
        local nargs=instr[2]
              local nresults=instr[3] or 1
              local methodName=_stmNxTSmVX.stack[_stmNxTSmVX.sp]
              _stmNxTSmVX.sp=_stmNxTSmVX.sp-1
              local obj=_stmNxTSmVX.stack[_stmNxTSmVX.sp-nargs]
              local fn=obj[methodName]
              local callArgs={obj}
              for i=1,nargs do callArgs[i+1]=_stmNxTSmVX.stack[_stmNxTSmVX.sp-nargs+i] end
              _stmNxTSmVX.sp=_stmNxTSmVX.sp-nargs-1
              local rets={fn(table.unpack(callArgs,1,nargs+1))}
              for i=1,nresults do _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=rets[i] end
      elseif op == 24 then
        local val=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; local idx=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; local obj=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; obj[idx]=val
      elseif op == 20 then
        _stmNxTSmVX.stack[_stmNxTSmVX.sp]=_un5GSwnlnF[instr[2]](_stmNxTSmVX.stack[_stmNxTSmVX.sp])
      elseif op == 11 then
        local nret=instr[2]
              local rets={}
              for i=nret,1,-1 do
                rets[i]=_stmNxTSmVX.stack[_stmNxTSmVX.sp]
                _stmNxTSmVX.sp=_stmNxTSmVX.sp-1
              end
              _stmNxTSmVX.ret=rets
      elseif op == 26 then
      elseif op == 29 then
        _stmNxTSmVX.halt=true
      elseif op == 7 then
        _stmNxTSmVX.sp=_stmNxTSmVX.sp-instr[2]
      elseif op == 22 then
        local obj=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; local val=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; obj[_decT2aqGEXi(_clQEk0VTZp(instr[2], protoIdx))]=val
      end
    elseif _svHAokmWPU == 1 then
      if op == 2 then
        _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=_decT2aqGEXi(_clQEk0VTZp(instr[2], protoIdx))
      elseif op == 23 then
        local idx=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; local obj=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=obj[idx]
      elseif op == 16 then
        local t=_stmNxTSmVX.stack[_stmNxTSmVX.sp-1]; local val=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; t[#t+1]=val
      elseif op == 1 then
      elseif op == 19 then
        local b=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; local a=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=_bcUfxLfRPS[instr[2]](a,b)
      elseif op == 27 then
        for i=1,#_stmNxTSmVX.varargs do _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=_stmNxTSmVX.varargs[i] end
      elseif op == 6 then
        local _idx=instr[2]; _stmNxTSmVX.locals[_idx]=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1
      elseif op == 30 then
        local t=_stmNxTSmVX.stack[_stmNxTSmVX.sp]
              for i=1,#_stmNxTSmVX.varargs do t[#t+1]=_stmNxTSmVX.varargs[i] end
      elseif op == 5 then
        _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=_stmNxTSmVX.locals[instr[2]]
      elseif op == 14 then
        local v=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1
              if v then _stmNxTSmVX.pc=instr[2] end
      elseif op == 9 then
        local nargs=instr[2]
              local nresults=instr[3] or 1
              local fn=_stmNxTSmVX.stack[_stmNxTSmVX.sp-nargs]
              local callArgs={}
              for i=1,nargs do callArgs[i]=_stmNxTSmVX.stack[_stmNxTSmVX.sp-nargs+i] end
              _stmNxTSmVX.sp=_stmNxTSmVX.sp-nargs-1
              local rets={fn(table.unpack(callArgs,1,nargs))}
              for i=1,nresults do _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=rets[i] end
      elseif op == 28 then
        _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=nil
      elseif op == 4 then
        _envpNmpU0a[_nmGH4QMljg[instr[2]]]=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1
      elseif op == 17 then
        local b=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; local a=_stmNxTSmVX.stack[_stmNxTSmVX.sp]; _stmNxTSmVX.sp=_stmNxTSmVX.sp-1; _stmNxTSmVX.sp=_stmNxTSmVX.sp+1; _stmNxTSmVX.stack[_stmNxTSmVX.sp]=tostring(a)..tostring(b)
      elseif op == 25 then
        _stmNxTSmVX.sp=_stmNxTSmVX.sp+1
              local _pi=instr[2]
              local _vmf=_vmsqpDBYhf
              _stmNxTSmVX.stack[_stmNxTSmVX.sp]=function(...)
                local _args={...}
                local _rets={_vmf(_pi,_envpNmpU0a,_args)}
                if #_rets>0 then return table.unpack(_rets) end
                return nil
              end
      end
    end
    if _stmNxTSmVX.halt then break end
    if _stmNxTSmVX.ret then return table.unpack(_stmNxTSmVX.ret) end
  end
  return nil
end
_vmsqpDBYhf(0, _envpNmpU0a, {})
