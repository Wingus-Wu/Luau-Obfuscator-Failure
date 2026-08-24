local _sdihezug_pool = {"|'","+'","'z"};
local function _sp_xorfn__sdihezug(a,b) local r,m=0,1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end a=math.floor(a/2) b=math.floor(b/2) m=m*2 end return r end
local _sp_cache__sdihezug = {}
local function _sdihezug(input)
  local _decoded = _sdihezug_pool[input]
  if _decoded then input = _decoded end
  if _sp_cache__sdihezug[input] then return _sp_cache__sdihezug[input] end
  local n = #input
  local buf = {}
  for i = 1, n do
    buf[i] = string.char(_sp_xorfn__sdihezug(string.byte(input, i), 7))
  end
  local result = table.concat(buf)
  _sp_cache__sdihezug[input] = result
  return result
end
if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutD6NwkTKs={};for _i=0,255 do _lutD6NwkTKs[_i]=bit32.bxor(_i,185) end;local _dcMCJyR3ZC={};local function _decZYh3KgFy(v)
  local c=_dcMCJyR3ZC[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutD6NwkTKs[v[i]])end;return s end)
  if ok then _dcMCJyR3ZC[v]=r;return r end
  return v
end
local _nm0vgmefcf_r={[0]={205,216,219,213,220},{222,220,205,230,202,204,219,202,220,205,202},{208,201,216,208,203,202},{201,203,208,215,205},{230,202,221,208,209,220,195,204,222}};local _nm0vgmefcf={};setmetatable(_nm0vgmefcf,{__index=function(_,k)
  local v=rawget(_nm0vgmefcf_r,k);local d=_decZYh3KgFy(v);rawset(_nm0vgmefcf,k,d);return d
end})
local _psyD7iQd7w = {[0] = {bc = {{26,1},{5,1},{18},{27,0},{3},{27,1},{3},{27,2},{3},{12,0},{17,1},{8,0},{22,1,1},{12,1},{17,2},{8,1},{22,1,3},{12,4},{12,3},{12,2},{8,2},{8,3},{8,4},{22,2,2},{12,5},{12,4},{8,4},{10,46},{17,3},{17,4},{27,0},{22,1,1},{17,0},{13,3},{8,5},{17,4},{27,1},{22,1,1},{22,2,1},{9,2},{17,4},{27,2},{22,1,1},{9,2},{22,1,0},{11,20},{15}}, _cpnC3Mm0NI = {[0]=1,2,3,{218,214,215,218,216,205}}, np = 0},[1] = {bc = {{8,1},{24},{1,5},{29,1},{27,0},{12,1},{8,2},{24},{1,11},{29,1},{18},{12,2},{8,3},{24},{1,17},{29,1},{18},{12,3},{8,1},{8,0},{16,2},{9,17},{10,36},{17,0},{13,1},{8,3},{18},{17,0},{13,2},{8,2},{22,1,1},{3},{22,2,0},{23,2},{8,3},{14,1},{17,1},{8,0},{8,1},{27,0},{9,19},{8,2},{8,3},{22,4,0},{17,0},{13,1},{8,2},{8,0},{8,1},{28},{22,2,0},{17,1},{8,0},{8,1},{27,0},{9,19},{8,2},{8,3},{22,4,0},{17,0},{13,3},{8,2},{22,1,0},{23,1},{8,3},{14,1},{14,0}}, _cpnC3Mm0NI = {[0]=1,{208,215,202,220,203,205},{204,215,201,216,218,210},{203,220,212,214,207,220}}, np = 4}}
local _rmue3Q2MeI={[20]=1,[27]=2,[17]=3,[5]=4,[8]=5,[12]=6,[29]=7,[24]=8,[22]=9,[21]=10,[14]=11,[11]=12,[10]=13,[1]=14,[18]=15,[3]=16,[30]=17,[19]=18,[9]=19,[16]=20,[13]=21,[25]=22,[28]=23,[2]=24,[26]=25,[23]=26,[7]=27,[6]=28,[15]=29,[4]=30}
local _bc4perhEdz={[1]=function(a,b) return a - b end,[2]=function(a,b) return tostring(a) .. tostring(b) end,[3]=function(a,b) return bit32.lshift(a, b) end,[4]=function(a,b) return a and b end,[5]=function(a,b) return a ~= b end,[6]=function(a,b) return a == b end,[7]=function(a,b) return a % b end,[8]=function(a,b) return a or b end,[9]=function(a,b) return a * b end,[10]=function(a,b) return a >= b end,[11]=function(a,b) return a / b end,[12]=function(a,b) return bit32.bor(a, b) end,[13]=function(a,b) return a // b end,[14]=function(a,b) return a < b end,[15]=function(a,b) return a ^ b end,[16]=function(a,b) return a <= b end,[17]=function(a,b) return a > b end,[18]=function(a,b) return bit32.band(a, b) end,[19]=function(a,b) return a + b end,[20]=function(a,b) return bit32.rshift(a, b) end}
local _unlW467yhh={[1]=function(a) return not a end,[2]=function(a) return #a end,[3]=function(a) return bit32.bnot(a) end,[4]=function(a) return -a end}
local _enABQcvjO2={}
for _i = 0, 4 do local _n = _nm0vgmefcf[_i]; if _n ~= nil then _enABQcvjO2[_n] = _G[_n] end end
_enABQcvjO2["_sdihezug"] = _sdihezug
local _hdh82SclyH={};
local function _h835979(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
end
local function _h633840(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local val=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; local idx=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; local obj=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; obj[idx]=val
end
local function _h293927(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.halt=true
end
local function _h646457(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _RrgL4Ro7x[_stLXr16e38.sp]=_unlW467yhh[instr[2]](_RrgL4Ro7x[_stLXr16e38.sp])
end
local function _h309459(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local nargs=instr[2]
      local nresults=instr[3]; if nresults==nil then nresults=1 end
      local methodName=_RrgL4Ro7x[_stLXr16e38.sp]
      _stLXr16e38.sp=_stLXr16e38.sp-1
      local obj=_RrgL4Ro7x[_stLXr16e38.sp-nargs]
      local fn=obj[methodName]
      local callArgs={obj}
      for i=1,nargs do callArgs[i+1]=_RrgL4Ro7x[_stLXr16e38.sp-nargs+i] end
      _stLXr16e38.sp=_stLXr16e38.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs+1))}
      for i=1,nresults do _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=rets[i] end
end
local function _h379581(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local nargs=instr[2]
      local nresults=instr[3]; if nresults==nil then nresults=1 end
      local fn=_RrgL4Ro7x[_stLXr16e38.sp-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=_RrgL4Ro7x[_stLXr16e38.sp-nargs+i] end
      _stLXr16e38.sp=_stLXr16e38.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs))}
      for i=1,nresults do _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=rets[i] end
end
local function _h303749(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=_decZYh3KgFy(_cpnC3Mm0NI[instr[2]])
end
local function _h432085(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _enABQcvjO2[_nm0vgmefcf[instr[2]]]=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1
end
local function _h402995(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=_enABQcvjO2[_nm0vgmefcf[instr[2]]]
end
local function _h213634(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _Lz8veuruW[instr[2]]=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1
end
local function _h345642(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local t=_RrgL4Ro7x[_stLXr16e38.sp-1]; local val=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; t[#t+1]=val
end
local function _h896802(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
end
local function _h376327(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _RrgL4Ro7x[_stLXr16e38.sp]=_RrgL4Ro7x[_stLXr16e38.sp][_decZYh3KgFy(_cpnC3Mm0NI[instr[2]])]
end
local function _h737899(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.sp=_stLXr16e38.sp-instr[2]
end
local function _h691419(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local b=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; local a=_RrgL4Ro7x[_stLXr16e38.sp]; _RrgL4Ro7x[_stLXr16e38.sp]=_bc4perhEdz[instr[2]](a,b)
end
local function _h849716(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local t=_RrgL4Ro7x[_stLXr16e38.sp]
      for i=1,#_VDbF0KlLG do t[#t+1]=_VDbF0KlLG[i] end
end
local function _h570162(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  for i=1,#_VDbF0KlLG do _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=_VDbF0KlLG[i] end
end
local function _h366630(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local v=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1
      if not v then _stLXr16e38.pc=instr[2] end
end
local function _h182124(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=nil
end
local function _h550188(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local idx=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; local obj=_RrgL4Ro7x[_stLXr16e38.sp]; _RrgL4Ro7x[_stLXr16e38.sp]=obj[idx]
end
local function _h384695(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _RrgL4Ro7x[_stLXr16e38.sp]=#_RrgL4Ro7x[_stLXr16e38.sp]
end
local function _h387443(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.pc=instr[2]
end
local function _h156752(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]={}
end
local function _h935256(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local nret=instr[2]
      local rets={}
      for i=nret,1,-1 do
        rets[i]=_RrgL4Ro7x[_stLXr16e38.sp]
        _stLXr16e38.sp=_stLXr16e38.sp-1
      end
      _stLXr16e38.ret=rets
end
local function _h181256(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local b=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; local a=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=tostring(a)..tostring(b)
end
local function _h215175(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.sp=_stLXr16e38.sp+1
      local _pi=instr[2]
      local _vmf=_vmRHi2ZrEU
      _RrgL4Ro7x[_stLXr16e38.sp]=function(...)
        local _args={...}
        local _rets={_vmf(_pi,_enABQcvjO2,_args)}
        if #_rets>0 then return table.unpack(_rets) end
        return nil
      end
end
local function _h761927(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=_Lz8veuruW[instr[2]]
end
local function _h297149(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local obj=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; local val=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1; obj[_decZYh3KgFy(_cpnC3Mm0NI[instr[2]])]=val
end
local function _h303292(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  _stLXr16e38.sp=_stLXr16e38.sp+1; _RrgL4Ro7x[_stLXr16e38.sp]=_RrgL4Ro7x[_stLXr16e38.sp-1]
end
local function _h640220(_RrgL4Ro7x,instr,_pi,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI)
  local v=_RrgL4Ro7x[_stLXr16e38.sp]; _stLXr16e38.sp=_stLXr16e38.sp-1
      if v then _stLXr16e38.pc=instr[2] end
end
_hdh82SclyH[4]=_hdh82SclyH[4] or _h432085
_hdh82SclyH[26]=_h896802
_hdh82SclyH[13]=_hdh82SclyH[13] or _h366630
_hdh82SclyH[6]=_hdh82SclyH[6] or _h213634
_hdh82SclyH[21]=_hdh82SclyH[21] or _h376327
_hdh82SclyH[16]=_hdh82SclyH[16] or _h345642
_hdh82SclyH[17]=_hdh82SclyH[17] or _h181256
_hdh82SclyH[8]=_h303292
_hdh82SclyH[18]=_hdh82SclyH[18] or _h384695
_hdh82SclyH[14]=_h640220
_hdh82SclyH[24]=_h633840
_hdh82SclyH[20]=_h646457
_hdh82SclyH[2]=_h303749
_hdh82SclyH[25]=_h215175
_hdh82SclyH[7]=_hdh82SclyH[7] or _h737899
_hdh82SclyH[19]=_hdh82SclyH[19] or _h691419
_hdh82SclyH[23]=_h550188
_hdh82SclyH[12]=_hdh82SclyH[12] or _h387443
_hdh82SclyH[29]=_h293927
_hdh82SclyH[27]=_h570162
_hdh82SclyH[11]=_hdh82SclyH[11] or _h935256
_hdh82SclyH[22]=_hdh82SclyH[22] or _h297149
_hdh82SclyH[9]=_h379581
_hdh82SclyH[1]=_h835979
_hdh82SclyH[3]=_h402995
_hdh82SclyH[28]=_h182124
_hdh82SclyH[15]=_h156752
_hdh82SclyH[10]=_h309459
_hdh82SclyH[5]=_h761927
_hdh82SclyH[30]=_hdh82SclyH[30] or _h849716
_vmRHi2ZrEU=function(protoIdx,_enABQcvjO2,args)
local proto=_psyD7iQd7w[protoIdx] local bc=proto.bc local _cpnC3Mm0NI=proto._cpnC3Mm0NI
  local _RrgL4Ro7x={} local _stLXr16e38={sp=-1,pc=0,ret=nil,halt=false} local _Lz8veuruW={} local _VDbF0KlLG=args or {}
  for i=1,proto.np or 0 do _Lz8veuruW[i-1]=_VDbF0KlLG[i] end
  while true do
    local instr=bc[_stLXr16e38.pc+1]
    if instr==nil then break end
    _stLXr16e38.pc=_stLXr16e38.pc+1
    _stLXr16e38.ret=nil
    local op=_rmue3Q2MeI[instr[1]] or instr[1]
    local h=_hdh82SclyH[op]
    if h then h(_RrgL4Ro7x,instr,protoIdx,_stLXr16e38,_Lz8veuruW,_VDbF0KlLG,_nm0vgmefcf,_bc4perhEdz,_unlW467yhh,_cpnC3Mm0NI) end
    if _stLXr16e38.halt then break end
    if _stLXr16e38.ret then return table.unpack(_stLXr16e38.ret) end
  end
  return nil
end
_vmRHi2ZrEU(0,_enABQcvjO2,{})
