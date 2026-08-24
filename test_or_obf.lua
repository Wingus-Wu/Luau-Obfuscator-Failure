if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutggrCoD0O={};for _i=0,255 do _lutggrCoD0O[_i]=bit32.bxor(_i,170) end;local _dcaj44QEk0={};local function _decVTZptZGq(v)
  local c=_dcaj44QEk0[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutggrCoD0O[v[i]])end;return s end)
  if ok then _dcaj44QEk0[v]=r;return r end
  return v
end
local _nmHV6ZB7yh_r={[0]={207,216,216,197,216},{245,220,207,216,195,204,211,245,156,152,154,159},{245,208,216,217,220,193,211},{200,195,222,153,152},{245,158,206,199},{218,216,195,196,222},{217,222,216,195,196,205}};local _nmHV6ZB7yh={};setmetatable(_nmHV6ZB7yh,{__index=function(_,k)
  local v=rawget(_nmHV6ZB7yh_r,k);local d=_decVTZptZGq(v);rawset(_nmHV6ZB7yh,k,d);return d
end})
local _psLfRPS5GS = {[0] = {bc = {{133,1},{145,1},{133,2},{145,4},{144,1},{156,0,0},{144,5},{144,4},{156,0,1},{156,1,0},{144,5},{144,4},{150,0},{156,1,1},{156,1,0},{144,5},{144,4},{150,0},{144,6},{150,1},{160},{150,2},{156,1,1},{156,2,1},{156,1,0},{144,5},{144,4},{150,0},{150,3},{150,4},{151,5},{144,6},{150,1},{160},{150,5},{156,1,1},{156,3,1},{156,1,0},{134}}, cp = {[0]=1,{200,211,222,207},{168},3,-1,{169}}, np = 0},[1] = {bc = {{150,0},{139,0},{150,1},{139,1},{148,1},{150,2},{151,13},{141,10},{150,3},{139,0},{148,0},{136,3},{141,16},{144,0},{150,4},{156,1,0},{158,1},{148,0},{132,1},{132,0}}, cp = {[0]=true,365015817,983974246,false,{241,235,196,222,195,254,203,199,218,207,216,247,138,227,196,222,207,205,216,195,222,211,138,220,195,197,198,203,222,195,197,196,138,206,207,222,207,201,222,207,206}}, np = 0},[2] = {bc = {{150,0},{139,3},{144,2},{150,1},{151,18},{141,11},{150,2},{150,3},{151,5},{139,4},{135,15},{150,4},{150,5},{151,12},{139,5},{150,6},{150,7},{151,8},{139,6},{150,8},{150,9},{151,5},{139,7},{150,10},{150,11},{151,12},{139,8},{150,12},{150,13},{151,12},{139,9},{150,14},{150,15},{151,12},{139,10},{150,16},{139,11},{150,17},{139,12},{150,18},{150,19},{151,8},{139,13},{150,20},{139,14},{150,21},{150,22},{151,5},{139,15},{153},{150,23},{159},{150,24},{159},{150,25},{159},{139,16},{153},{150,26},{159},{150,27},{159},{150,28},{159},{139,17},{150,29},{150,30},{151,5},{139,18},{150,31},{150,32},{151,12},{139,19},{150,33},{150,34},{151,12},{139,20},{148,0},{149},{143,87},{137,1},{144,3},{150,35},{160},{150,36},{150,37},{156,2,1},{139,0},{148,1},{149},{143,93},{137,1},{150,38},{139,1},{148,2},{149},{143,104},{137,1},{144,3},{150,35},{160},{150,39},{150,37},{156,2,1},{139,2},{158,1},{148,0},{148,1},{151,5},{148,2},{151,5},{132,1},{132,0}}, cp = {[0]={219,218,222,194,222},121,41,293,42,368,758,276,959,373,413,978,471,22,343,104,{200,194,201,199},{206,206,198,198,216,200},899,614,{216,220,193,199,208,206,216,200,208},188,401,75,550,722,461,576,389,508,398,424,624,800,447,{200,203,196,206},10,4294967295,20,30}, np = 3}}
local _bcijoGSf6d = {[1]=function(a,b) return a // b end,[2]=function(a,b) return a % b end,[3]=function(a,b) return a ^ b end,[4]=function(a,b) return tostring(a) .. tostring(b) end,[5]=function(a,b) return a + b end,[6]=function(a,b) return a <= b end,[7]=function(a,b) return bit32.rshift(a, b) end,[8]=function(a,b) return a - b end,[9]=function(a,b) return bit32.lshift(a, b) end,[10]=function(a,b) return bit32.band(a, b) end,[11]=function(a,b) return a == b end,[12]=function(a,b) return a * b end,[13]=function(a,b) return a ~= b end,[14]=function(a,b) return bit32.bor(a, b) end,[15]=function(a,b) return a and b end,[16]=function(a,b) return a or b end,[17]=function(a,b) return a >= b end,[18]=function(a,b) return a > b end,[19]=function(a,b) return a < b end,[20]=function(a,b) return a / b end}
local _uncK1pusqp = {[1]=function(a) return -a end,[2]=function(a) return bit32.bnot(a) end,[3]=function(a) return not a end,[4]=function(a) return #a end}
local _rm6lUCatyU = {[138]=1,[150]=2,[144]=3,[145]=4,[148]=5,[139]=6,[137]=7,[149]=8,[156]=9,[152]=10,[132]=11,[135]=12,[141]=13,[143]=14,[153]=15,[159]=16,[157]=17,[142]=18,[151]=19,[136]=20,[147]=21,[155]=22,[160]=23,[154]=24,[133]=25,[158]=26,[161]=27,[146]=28,[134]=29,[140]=30}
local _cpmpU0aZha = {}
_cpmpU0aZha[0] = {[0]=1,{200,211,222,207},{168},3,-1,{169}}
_cpmpU0aZha[1] = {[0]=true,365015817,983974246,false,{241,235,196,222,195,254,203,199,218,207,216,247,138,227,196,222,207,205,216,195,222,211,138,220,195,197,198,203,222,195,197,196,138,206,207,222,207,201,222,207,206}}
_cpmpU0aZha[2] = {[0]={219,218,222,194,222},121,41,293,42,368,758,276,959,373,413,978,471,22,343,104,{200,194,201,199},{206,206,198,198,216,200},899,614,{216,220,193,199,208,206,216,200,208},188,401,75,550,722,461,576,389,508,398,424,624,800,447,{200,203,196,206},10,4294967295,20,30}
local _cc2nREfMvV = {}
local function _clIIPgDekh(idx, pIdx)
  if pIdx == nil then pIdx = 0 end
  local key = pIdx * 100003 + idx
  if _cc2nREfMvV[key] ~= nil then return _cc2nREfMvV[key] end
  local val = _cpmpU0aZha[pIdx][idx]
  _cc2nREfMvV[key] = val
  return val
end
local _enDBYhfmNx = {}
for _i = 0, 6 do local _n = _nmHV6ZB7yh[_i]; if _n ~= nil then _enDBYhfmNx[_n] = _G[_n] end end
local function _rslvwnlnFvpN(key)
  if _enDBYhfmNx[key] == nil then
    _enDBYhfmNx[key] = _G[key]
  end
  return _enDBYhfmNx[key]
end
local _band2aqGEXiX = {[1]=1,[2]=3,[3]=1,[4]=2,[5]=1,[6]=3,[7]=1,[8]=2,[9]=0,[10]=0,[11]=0,[12]=1,[13]=3,[14]=3,[15]=1,[16]=1,[17]=0,[18]=2,[19]=2,[20]=3,[21]=0,[22]=3,[23]=0,[24]=3,[25]=2,[26]=0,[27]=0,[28]=1,[29]=2,[30]=2}
local function _vmkErfobPb(protoIdx, _enDBYhfmNx, args)
  local proto = _psLfRPS5GS[protoIdx]
  local bc = proto.bc
  local _stnlSlsKpO = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do _stnlSlsKpO.locals[i-1]=_stnlSlsKpO.varargs[i] end
  while true do
    local instr = bc[_stnlSlsKpO.pc + 1]
    if instr == nil then break end
    _stnlSlsKpO.pc = _stnlSlsKpO.pc + 1
    _stnlSlsKpO.ret = nil
    local op = _rm6lUCatyU[instr[1]] or instr[1]
    _svnbmLa3U8 = _band2aqGEXiX[op]
    if _svnbmLa3U8 == 0 then
      if op == 21 then
        _stnlSlsKpO.stack[_stnlSlsKpO.sp]=_stnlSlsKpO.stack[_stnlSlsKpO.sp][_decVTZptZGq(_clIIPgDekh(instr[2], protoIdx))]
      elseif op == 10 then
        local nargs=instr[2]
              local nresults=instr[3] or 1
              local methodName=_stnlSlsKpO.stack[_stnlSlsKpO.sp]
              _stnlSlsKpO.sp=_stnlSlsKpO.sp-1
              local obj=_stnlSlsKpO.stack[_stnlSlsKpO.sp-nargs]
              local fn=obj[methodName]
              local callArgs={obj}
              for i=1,nargs do callArgs[i+1]=_stnlSlsKpO.stack[_stnlSlsKpO.sp-nargs+i] end
              _stnlSlsKpO.sp=_stnlSlsKpO.sp-nargs-1
              local rets={fn(table.unpack(callArgs,1,nargs+1))}
              for i=1,nresults do _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=rets[i] end
      elseif op == 27 then
        for i=1,#_stnlSlsKpO.varargs do _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=_stnlSlsKpO.varargs[i] end
      elseif op == 9 then
        local nargs=instr[2]
              local nresults=instr[3] or 1
              local fn=_stnlSlsKpO.stack[_stnlSlsKpO.sp-nargs]
              local callArgs={}
              for i=1,nargs do callArgs[i]=_stnlSlsKpO.stack[_stnlSlsKpO.sp-nargs+i] end
              _stnlSlsKpO.sp=_stnlSlsKpO.sp-nargs-1
              local rets={fn(table.unpack(callArgs,1,nargs))}
              for i=1,nresults do _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=rets[i] end
      elseif op == 23 then
        local idx=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; local obj=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=obj[idx]
      elseif op == 17 then
        local b=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; local a=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=tostring(a)..tostring(b)
      elseif op == 11 then
        local nret=instr[2]
              local rets={}
              for i=nret,1,-1 do
                rets[i]=_stnlSlsKpO.stack[_stnlSlsKpO.sp]
                _stnlSlsKpO.sp=_stnlSlsKpO.sp-1
              end
              _stnlSlsKpO.ret=rets
      elseif op == 26 then
      end
    elseif _svnbmLa3U8 == 1 then
      if op == 1 then
      elseif op == 28 then
        _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=nil
      elseif op == 16 then
        local t=_stnlSlsKpO.stack[_stnlSlsKpO.sp-1]; local val=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; t[#t+1]=val
      elseif op == 12 then
        _stnlSlsKpO.pc=instr[2]
      elseif op == 7 then
        _stnlSlsKpO.sp=_stnlSlsKpO.sp-instr[2]
      elseif op == 5 then
        _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=_stnlSlsKpO.locals[instr[2]]
      elseif op == 15 then
        _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]={}
      elseif op == 3 then
        _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=_enDBYhfmNx[_nmHV6ZB7yh[instr[2]]]
      end
    elseif _svnbmLa3U8 == 2 then
      if op == 19 then
        local b=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; local a=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=_bcijoGSf6d[instr[2]](a,b)
      elseif op == 25 then
        _stnlSlsKpO.sp=_stnlSlsKpO.sp+1
              local _pi=instr[2]
              local _vmf=_vmkErfobPb
              _stnlSlsKpO.stack[_stnlSlsKpO.sp]=function(...)
                local _args={...}
                local _rets={_vmf(_pi,_enDBYhfmNx,_args)}
                if #_rets>0 then return table.unpack(_rets) end
                return nil
              end
      elseif op == 30 then
        local t=_stnlSlsKpO.stack[_stnlSlsKpO.sp]
              for i=1,#_stnlSlsKpO.varargs do t[#t+1]=_stnlSlsKpO.varargs[i] end
      elseif op == 8 then
        _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=_stnlSlsKpO.stack[_stnlSlsKpO.sp-1]
      elseif op == 29 then
        _stnlSlsKpO.halt=true
      elseif op == 4 then
        _enDBYhfmNx[_nmHV6ZB7yh[instr[2]]]=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1
      elseif op == 18 then
        _stnlSlsKpO.stack[_stnlSlsKpO.sp]=#_stnlSlsKpO.stack[_stnlSlsKpO.sp]
      end
    elseif _svnbmLa3U8 == 3 then
      if op == 2 then
        _stnlSlsKpO.sp=_stnlSlsKpO.sp+1; _stnlSlsKpO.stack[_stnlSlsKpO.sp]=_decVTZptZGq(_clIIPgDekh(instr[2], protoIdx))
      elseif op == 20 then
        _stnlSlsKpO.stack[_stnlSlsKpO.sp]=_uncK1pusqp[instr[2]](_stnlSlsKpO.stack[_stnlSlsKpO.sp])
      elseif op == 24 then
        local val=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; local idx=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; local obj=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; obj[idx]=val
      elseif op == 22 then
        local obj=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; local val=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1; obj[_decVTZptZGq(_clIIPgDekh(instr[2], protoIdx))]=val
      elseif op == 14 then
        local v=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1
              if v then _stnlSlsKpO.pc=instr[2] end
      elseif op == 6 then
        local _idx=instr[2]; _stnlSlsKpO.locals[_idx]=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1
      elseif op == 13 then
        local v=_stnlSlsKpO.stack[_stnlSlsKpO.sp]; _stnlSlsKpO.sp=_stnlSlsKpO.sp-1
              if not v then _stnlSlsKpO.pc=instr[2] end
      end
    end
    if _stnlSlsKpO.halt then break end
    if _stnlSlsKpO.ret then return table.unpack(_stnlSlsKpO.ret) end
  end
  return nil
end
_vmkErfobPb(0, _enDBYhfmNx, {})
