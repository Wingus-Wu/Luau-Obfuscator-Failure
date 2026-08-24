if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutGH4QMljg={};for _i=0,255 do _lutGH4QMljg[_i]=bit32.bxor(_i,203) end;local _dcUfxLfRPS={};local function _dec5GSwnlnF(v)
  local c=_dcUfxLfRPS[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutGH4QMljg[v[i]])end;return s end)
  if ok then _dcUfxLfRPS[v]=r;return r end
  return v
end
local _nmTnoLG4kY_r={[0]={148,185,161,186,169,189},{148,179,173,170,169,170,174},{148,166,191,163,168},{148,255,175,166},{187,185,162,165,191}};local _nmTnoLG4kY={};setmetatable(_nmTnoLG4kY,{__index=function(_,k)
  local v=rawget(_nmTnoLG4kY_r,k);local d=_dec5GSwnlnF(v);rawset(_nmTnoLG4kY,k,d);return d
end})
local _psSf6dcK1p = {[0] = {bc = {{10,1},{27,3},{20,4},{20,3},{12,0,1},{12,1,0},{20,4},{20,3},{28,0},{12,1,1},{12,1,0},{20,4},{20,3},{28,0},{28,1},{12,2,1},{12,1,0},{20,4},{20,3},{28,0},{28,1},{28,2},{12,3,1},{12,1,0},{16}}, _cpsKpOHV6Z = {[0]=1,2,3}, np = 0},[1] = {bc = {{28,0},{28,1},{21,2},{22,3},{20,0},{28,2},{21,7},{30,13},{28,3},{28,4},{21,2},{22,4},{3,17},{28,5},{28,6},{21,4},{22,5},{28,7},{28,8},{21,1},{22,6},{20,1},{28,9},{21,7},{30,30},{28,10},{28,11},{21,2},{22,7},{3,34},{28,12},{28,13},{21,4},{22,8},{5},{28,14},{11},{28,15},{11},{22,9},{28,16},{22,10},{20,2},{28,14},{21,7},{30,51},{28,17},{28,18},{21,1},{22,11},{3,55},{28,19},{28,20},{21,2},{22,12},{28,21},{28,22},{21,4},{22,13},{28,23},{22,14},{28,24},{22,15},{5},{28,25},{11},{28,26},{11},{28,27},{11},{28,28},{11},{22,16},{28,29},{22,17},{26,0},{1},{2,80},{8,1},{28,30},{22,0},{26,1},{1},{2,86},{8,1},{28,31},{22,1},{26,2},{1},{2,92},{8,1},{28,32},{22,2},{19,1},{26,0},{26,1},{21,1},{26,2},{21,1},{14,1},{14,0}}, _cpsKpOHV6Z = {[0]=945,19,312,412,28,518,235,21,966,363,876,987,856,571,606,200,880,871,950,351,67,852,587,89,115,939,957,395,120,650,10,20,30}, np = 3}}
local _rmfmNxTSmV={[29]=1,[28]=2,[20]=3,[27]=4,[26]=5,[22]=6,[8]=7,[1]=8,[12]=9,[4]=10,[14]=11,[3]=12,[30]=13,[2]=14,[5]=15,[11]=16,[23]=17,[7]=18,[21]=19,[9]=20,[24]=21,[6]=22,[13]=23,[15]=24,[10]=25,[19]=26,[25]=27,[17]=28,[16]=29,[18]=30}
local _bcSuanna0g={[1]=function(a,b) return a + b end,[2]=function(a,b) return a * b end,[3]=function(a,b) return a or b end,[4]=function(a,b) return a - b end,[5]=function(a,b) return a // b end,[6]=function(a,b) return bit32.band(a, b) end,[7]=function(a,b) return a > b end,[8]=function(a,b) return a == b end,[9]=function(a,b) return a >= b end,[10]=function(a,b) return bit32.lshift(a, b) end,[11]=function(a,b) return a and b end,[12]=function(a,b) return a ^ b end,[13]=function(a,b) return a ~= b end,[14]=function(a,b) return bit32.rshift(a, b) end,[15]=function(a,b) return tostring(a) .. tostring(b) end,[16]=function(a,b) return a / b end,[17]=function(a,b) return a <= b end,[18]=function(a,b) return bit32.bor(a, b) end,[19]=function(a,b) return a < b end,[20]=function(a,b) return a % b end}
local _unp952kErf={[1]=function(a) return not a end,[2]=function(a) return bit32.bnot(a) end,[3]=function(a) return #a end,[4]=function(a) return -a end}
local _enobPbnlSl={}
for _i = 0, 4 do local _n = _nmTnoLG4kY[_i]; if _n ~= nil then _enobPbnlSl[_n] = _G[_n] end end
local _hdusqpDBYh={};
local function _h771600(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]={}
end
local function _h520488(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local v=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1
      if v then _stnLotowuh.pc=instr[2] end
end
local function _h108018(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local val=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; local idx=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; local obj=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; obj[idx]=val
end
local function _h380092(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local v=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1
      if not v then _stnLotowuh.pc=instr[2] end
end
local function _h448757(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local obj=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; local val=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; obj[_dec5GSwnlnF(_cpsKpOHV6Z[instr[2]])]=val
end
local function _h775467(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local t=_RjAHQ44YK[_stnLotowuh.sp-1]; local val=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; t[#t+1]=val
end
local function _h291496(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=nil
end
local function _h125539(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _RjAHQ44YK[_stnLotowuh.sp]=_unp952kErf[instr[2]](_RjAHQ44YK[_stnLotowuh.sp])
end
local function _h279668(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local t=_RjAHQ44YK[_stnLotowuh.sp]
      for i=1,#_VfFttd5fh do t[#t+1]=_VfFttd5fh[i] end
end
local function _h650077(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  for i=1,#_VfFttd5fh do _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=_VfFttd5fh[i] end
end
local function _h109119(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
end
local function _h912612(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local nargs=instr[2]
      local nresults=instr[3]; if nresults==nil then nresults=1 end
      local methodName=_RjAHQ44YK[_stnLotowuh.sp]
      _stnLotowuh.sp=_stnLotowuh.sp-1
      local obj=_RjAHQ44YK[_stnLotowuh.sp-nargs]
      local fn=obj[methodName]
      local callArgs={obj}
      for i=1,nargs do callArgs[i+1]=_RjAHQ44YK[_stnLotowuh.sp-nargs+i] end
      _stnLotowuh.sp=_stnLotowuh.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs+1))}
      for i=1,nresults do _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=rets[i] end
end
local function _h772775(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=_Lq2tROZGs[instr[2]]
end
local function _h972523(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local nargs=instr[2]
      local nresults=instr[3]; if nresults==nil then nresults=1 end
      local fn=_RjAHQ44YK[_stnLotowuh.sp-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=_RjAHQ44YK[_stnLotowuh.sp-nargs+i] end
      _stnLotowuh.sp=_stnLotowuh.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs))}
      for i=1,nresults do _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=rets[i] end
end
local function _h696623(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=_dec5GSwnlnF(_cpsKpOHV6Z[instr[2]])
end
local function _h193271(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.halt=true
end
local function _h190334(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.pc=instr[2]
end
local function _h346999(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _enobPbnlSl[_nmTnoLG4kY[instr[2]]]=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1
end
local function _h510796(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local b=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; local a=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=tostring(a)..tostring(b)
end
local function _h309733(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local idx=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; local obj=_RjAHQ44YK[_stnLotowuh.sp]; _RjAHQ44YK[_stnLotowuh.sp]=obj[idx]
end
local function _h525390(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=_enobPbnlSl[_nmTnoLG4kY[instr[2]]]
end
local function _h863769(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.sp=_stnLotowuh.sp+1
      local _pi=instr[2]
      local _vmf=_vmXB5vJGpC
      _RjAHQ44YK[_stnLotowuh.sp]=function(...)
        local _args={...}
        local _rets={_vmf(_pi,_enobPbnlSl,_args)}
        if #_rets>0 then return table.unpack(_rets) end
        return nil
      end
end
local function _h688343(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
end
local function _h109455(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _RjAHQ44YK[_stnLotowuh.sp]=_RjAHQ44YK[_stnLotowuh.sp][_dec5GSwnlnF(_cpsKpOHV6Z[instr[2]])]
end
local function _h232477(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local b=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1; local a=_RjAHQ44YK[_stnLotowuh.sp]; _RjAHQ44YK[_stnLotowuh.sp]=_bcSuanna0g[instr[2]](a,b)
end
local function _h916275(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.sp=_stnLotowuh.sp-instr[2]
end
local function _h917086(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _Lq2tROZGs[instr[2]]=_RjAHQ44YK[_stnLotowuh.sp]; _stnLotowuh.sp=_stnLotowuh.sp-1
end
local function _h719042(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _RjAHQ44YK[_stnLotowuh.sp]=#_RjAHQ44YK[_stnLotowuh.sp]
end
local function _h543027(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  _stnLotowuh.sp=_stnLotowuh.sp+1; _RjAHQ44YK[_stnLotowuh.sp]=_RjAHQ44YK[_stnLotowuh.sp-1]
end
local function _h246571(_RjAHQ44YK,instr,_pi,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z)
  local nret=instr[2]
      local rets={}
      for i=nret,1,-1 do
        rets[i]=_RjAHQ44YK[_stnLotowuh.sp]
        _stnLotowuh.sp=_stnLotowuh.sp-1
      end
      _stnLotowuh.ret=rets
end
_hdusqpDBYh[17]=_h510796
_hdusqpDBYh[15]=_hdusqpDBYh[15] or _h771600
_hdusqpDBYh[23]=_hdusqpDBYh[23] or _h309733
_hdusqpDBYh[25]=_h863769
_hdusqpDBYh[22]=_h448757
_hdusqpDBYh[29]=_hdusqpDBYh[29] or _h193271
_hdusqpDBYh[6]=_h917086
_hdusqpDBYh[21]=_hdusqpDBYh[21] or _h109455
_hdusqpDBYh[2]=_h696623
_hdusqpDBYh[26]=_hdusqpDBYh[26] or _h109119
_hdusqpDBYh[19]=_hdusqpDBYh[19] or _h232477
_hdusqpDBYh[12]=_h190334
_hdusqpDBYh[9]=_h972523
_hdusqpDBYh[24]=_hdusqpDBYh[24] or _h108018
_hdusqpDBYh[13]=_h380092
_hdusqpDBYh[11]=_hdusqpDBYh[11] or _h246571
_hdusqpDBYh[27]=_h650077
_hdusqpDBYh[10]=_hdusqpDBYh[10] or _h912612
_hdusqpDBYh[30]=_hdusqpDBYh[30] or _h279668
_hdusqpDBYh[4]=_hdusqpDBYh[4] or _h346999
_hdusqpDBYh[14]=_h520488
_hdusqpDBYh[16]=_h775467
_hdusqpDBYh[5]=_hdusqpDBYh[5] or _h772775
_hdusqpDBYh[18]=_hdusqpDBYh[18] or _h719042
_hdusqpDBYh[20]=_h125539
_hdusqpDBYh[28]=_h291496
_hdusqpDBYh[8]=_h543027
_hdusqpDBYh[3]=_hdusqpDBYh[3] or _h525390
_hdusqpDBYh[1]=_hdusqpDBYh[1] or _h688343
_hdusqpDBYh[7]=_h916275
_vmXB5vJGpC=function(protoIdx,_enobPbnlSl,args)
local proto=_psSf6dcK1p[protoIdx] local bc=proto.bc local _cpsKpOHV6Z=proto._cpsKpOHV6Z
  local _RjAHQ44YK={} local _stnLotowuh={sp=-1,pc=0,ret=nil,halt=false} local _Lq2tROZGs={} local _VfFttd5fh=args or {}
  for i=1,proto.np or 0 do _Lq2tROZGs[i-1]=_VfFttd5fh[i] end
  while true do
    local instr=bc[_stnLotowuh.pc+1]
    if instr==nil then break end
    _stnLotowuh.pc=_stnLotowuh.pc+1
    _stnLotowuh.ret=nil
    local op=_rmfmNxTSmV[instr[1]] or instr[1]
    local h=_hdusqpDBYh[op]
    if h then h(_RjAHQ44YK,instr,protoIdx,_stnLotowuh,_Lq2tROZGs,_VfFttd5fh,_nmTnoLG4kY,_bcSuanna0g,_unp952kErf,_cpsKpOHV6Z) end
    if _stnLotowuh.halt then break end
    if _stnLotowuh.ret then return table.unpack(_stnLotowuh.ret) end
  end
  return nil
end
_vmXB5vJGpC(0,_enobPbnlSl,{})
