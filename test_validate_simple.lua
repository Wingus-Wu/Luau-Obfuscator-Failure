if not bit32 then bit32={band=function(a,b)local r=0 local m=1 while a>0 and b>0 do if a%2==1 and b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2==1 or b%2==1 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bxor=function(a,b)local r=0 local m=1 while a>0 or b>0 do if a%2~=b%2 then r=r+m end;a=math.floor(a/2);b=math.floor(b/2);m=m*2 end return r end,bnot=function(a)return 4294967295-(a%4294967296) end,lshift=function(a,b)return a*2^b%4294967296 end,rshift=function(a,b)return math.floor(a/2^b) end} end
local _lutW467yhhA={};for _i=0,255 do _lutW467yhhA[_i]=bit32.bxor(_i,46) end;local _dcBQcvjO2n={};local function _decC3Mm0NIC(v)
  local c=_dcBQcvjO2n[v]; if c~=nil then return c end
  local ok,r=pcall(function()local s="";for i=1,#v do s=s..string.char(_lutW467yhhA[v[i]])end;return s end)
  if ok then _dcBQcvjO2n[v]=r;return r end
  return v
end
local _nmSZz7hL1J_r={[0]={90,79,76,66,75},{73,75,90,113,93,91,76,93,75,90,93},{71,94,79,71,92,93},{94,92,71,64,90}};local _nmSZz7hL1J={};setmetatable(_nmSZz7hL1J,{__index=function(_,k)
  local v=rawget(_nmSZz7hL1J_r,k);local d=_decC3Mm0NIC(v);rawset(_nmSZz7hL1J,k,d);return d
end})
local _cpls4perhEdz = {}
_cpls4perhEdz[0] = {[0]={[0]={85,14},{77,65,64,77,79,90},{2,14},{14,83}},{[0]=1,2,3},{},{}}
_cpls4perhEdz[0].__d = {[0]=1,1,1,0,0,0,0}
_cpls4perhEdz[0].__s = {[0]=0,1,2,0,1,2,3}
_cpls4perhEdz[1] = {[0]={[0]={71,64,93,75,92,90},{91,64,94,79,77,69},{92,75,67,65,88,75}},{[0]=1},{},{}}
_cpls4perhEdz[1].__d = {[0]=1,0,0,0}
_cpls4perhEdz[1].__s = {[0]=0,0,1,2}
local _psz8veuruW = {[0] = {bc = {{240,1},{242,1},{227},{236,0},{249},{236,1},{249},{236,2},{249},{244,0},{230,1},{250,0},{226,1,1},{244,1},{230,2},{250,1},{226,1,3},{244,4},{244,3},{244,2},{250,2},{250,3},{250,4},{226,2,2},{244,5},{244,4},{250,4},{241,40},{230,3},{236,3},{230,0},{248,4},{250,5},{236,5},{226,2,1},{246,10},{236,6},{246,10},{226,1,0},{238,20},{234}}, cp = {[0]=1,2,3,{85,14},{77,65,64,77,79,90},{2,14},{14,83}}, np = 0},[1] = {bc = {{250,1},{252},{229,5},{233,1},{236,0},{244,1},{250,2},{252},{229,11},{233,1},{227},{244,2},{250,3},{252},{229,17},{233,1},{227},{244,3},{250,1},{250,0},{247,3},{246,12},{241,36},{230,0},{248,1},{250,3},{227},{230,0},{248,2},{250,2},{226,1,1},{249},{226,2,0},{231,2},{250,3},{239,1},{230,1},{250,0},{250,1},{236,0},{246,20},{250,2},{250,3},{226,4,0},{230,0},{248,1},{250,2},{250,0},{250,1},{225},{226,2,0},{230,1},{250,0},{250,1},{236,0},{246,20},{250,2},{250,3},{226,4,0},{230,0},{248,3},{250,2},{226,1,0},{231,1},{250,3},{239,1},{239,0}}, cp = {[0]=1,{71,64,93,75,92,90},{91,64,94,79,77,69},{92,75,67,65,88,75}}, np = 4}}
local _bcI8Ypcs7N = {[1]=function(a,b) return a == b end,[2]=function(a,b) return a and b end,[3]=function(a,b) return a or b end,[4]=function(a,b) return a <= b end,[5]=function(a,b) return bit32.bor(a, b) end,[6]=function(a,b) return bit32.rshift(a, b) end,[7]=function(a,b) return a // b end,[8]=function(a,b) return a ~= b end,[9]=function(a,b) return a < b end,[10]=function(a,b) return tostring(a) .. tostring(b) end,[11]=function(a,b) return bit32.lshift(a, b) end,[12]=function(a,b) return a > b end,[13]=function(a,b) return a - b end,[14]=function(a,b) return a / b end,[15]=function(a,b) return a >= b end,[16]=function(a,b) return bit32.band(a, b) end,[17]=function(a,b) return a * b end,[18]=function(a,b) return a % b end,[19]=function(a,b) return a ^ b end,[20]=function(a,b) return a + b end}
local _unzLmbMUcw = {[1]=function(a) return not a end,[2]=function(a) return bit32.bnot(a) end,[3]=function(a) return #a end,[4]=function(a) return -a end}
local _enRHi2ZrEU = {}
for _i = 0, 3 do local _n = _nmSZz7hL1J[_i]; if _n ~= nil then _enRHi2ZrEU[_n] = _G[_n] end end
local function _rslv0vgmefcf(key)
  if _enRHi2ZrEU[key] == nil and key ~= "nil" then
    _enRHi2ZrEU[key] = _G[key]
  end
  return _enRHi2ZrEU[key]
end
local _vmbdblwSpO
local function _h166828(_stKUsV299O, instr, ctx)
  local t=_stKUsV299O.stack[_stKUsV299O.sp-1]; local val=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; t[#t+1]=val
end
local function _h594139(_stKUsV299O, instr, ctx)
  local nargs=instr[2]
      local nresults=instr[3] or 1
      local methodName=_stKUsV299O.stack[_stKUsV299O.sp]
      _stKUsV299O.sp=_stKUsV299O.sp-1
      local obj=_stKUsV299O.stack[_stKUsV299O.sp-nargs]
      local fn=obj[methodName]
      local callArgs={obj}
      for i=1,nargs do callArgs[i+1]=_stKUsV299O.stack[_stKUsV299O.sp-nargs+i] end
      _stKUsV299O.sp=_stKUsV299O.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs+1))}
      for i=1,nresults do _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=rets[i] end
end
local function _h749559(_stKUsV299O, instr, ctx)
  local v=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1
      if not v then _stKUsV299O.pc=instr[2] end
end
local function _h530284(_stKUsV299O, instr, ctx)
  _stKUsV299O.sp=_stKUsV299O.sp-instr[2]
end
local function _h950750(_stKUsV299O, instr, ctx)
  _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=_stKUsV299O.stack[_stKUsV299O.sp-1]
end
local function _h679839(_stKUsV299O, instr, ctx)
  local obj=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; local val=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; obj[_decC3Mm0NIC(_cpls4perhEdz[ctx.pIdx or 0][_cpls4perhEdz[ctx.pIdx or 0].__d[instr[2]]][_cpls4perhEdz[ctx.pIdx or 0].__s[instr[2]]])]=val
end
local function _h424712(_stKUsV299O, instr, ctx)
  for i=1,#_stKUsV299O.varargs do _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=_stKUsV299O.varargs[i] end
end
local function _h251172(_stKUsV299O, instr, ctx)
  _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=_stKUsV299O.locals[instr[2]]
end
local function _h760601(_stKUsV299O, instr, ctx)
  _enRHi2ZrEU[_nmSZz7hL1J[instr[2]]]=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1
end
local function _h629654(_stKUsV299O, instr, ctx)
  _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]={}
end
local function _h369260(_stKUsV299O, instr, ctx)
end
local function _h664681(_stKUsV299O, instr, ctx)
end
local function _h514640(_stKUsV299O, instr, ctx)
  _stKUsV299O.pc=instr[2]
end
local function _h617581(_stKUsV299O, instr, ctx)
  local b=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; local a=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.stack[_stKUsV299O.sp]=_bcI8Ypcs7N[instr[2]](a,b)
end
local function _h449526(_stKUsV299O, instr, ctx)
  _stKUsV299O.stack[_stKUsV299O.sp]=#_stKUsV299O.stack[_stKUsV299O.sp]
end
local function _h732436(_stKUsV299O, instr, ctx)
  local _idx=instr[2]; _stKUsV299O.locals[_idx]=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1
end
local function _h901178(_stKUsV299O, instr, ctx)
  _stKUsV299O.sp=_stKUsV299O.sp+1
      local _pi=instr[2]
      local _vmf=_vmbdblwSpO
      _stKUsV299O.stack[_stKUsV299O.sp]=function(...)
        local _args={...}
        local _rets={_vmf(_pi,_enRHi2ZrEU,_args)}
        if #_rets>0 then return table.unpack(_rets) end
        return nil
      end
end
local function _h842721(_stKUsV299O, instr, ctx)
  _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=_decC3Mm0NIC(_cpls4perhEdz[ctx.pIdx or 0][_cpls4perhEdz[ctx.pIdx or 0].__d[instr[2]]][_cpls4perhEdz[ctx.pIdx or 0].__s[instr[2]]])
end
local function _h510588(_stKUsV299O, instr, ctx)
  local v=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1
      if v then _stKUsV299O.pc=instr[2] end
end
local function _h842969(_stKUsV299O, instr, ctx)
  _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=_enRHi2ZrEU[_nmSZz7hL1J[instr[2]]]
end
local function _h831930(_stKUsV299O, instr, ctx)
  _stKUsV299O.stack[_stKUsV299O.sp]=_stKUsV299O.stack[_stKUsV299O.sp][_decC3Mm0NIC(_cpls4perhEdz[ctx.pIdx or 0][_cpls4perhEdz[ctx.pIdx or 0].__d[instr[2]]][_cpls4perhEdz[ctx.pIdx or 0].__s[instr[2]]])]
end
local function _h204213(_stKUsV299O, instr, ctx)
  local nret=instr[2]
      local rets={}
      for i=nret,1,-1 do
        rets[i]=_stKUsV299O.stack[_stKUsV299O.sp]
        _stKUsV299O.sp=_stKUsV299O.sp-1
      end
      _stKUsV299O.ret=rets
end
local function _h904002(_stKUsV299O, instr, ctx)
  local nargs=instr[2]
      local nresults=instr[3] or 1
      local fn=_stKUsV299O.stack[_stKUsV299O.sp-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=_stKUsV299O.stack[_stKUsV299O.sp-nargs+i] end
      _stKUsV299O.sp=_stKUsV299O.sp-nargs-1
      local rets={fn(table.unpack(callArgs,1,nargs))}
      for i=1,nresults do _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=rets[i] end
end
local function _h631363(_stKUsV299O, instr, ctx)
  _stKUsV299O.stack[_stKUsV299O.sp]=_unzLmbMUcw[instr[2]](_stKUsV299O.stack[_stKUsV299O.sp])
end
local function _h191239(_stKUsV299O, instr, ctx)
  _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=nil
end
local function _h556319(_stKUsV299O, instr, ctx)
  local t=_stKUsV299O.stack[_stKUsV299O.sp]
      for i=1,#_stKUsV299O.varargs do t[#t+1]=_stKUsV299O.varargs[i] end
end
local function _h457935(_stKUsV299O, instr, ctx)
  _stKUsV299O.halt=true
end
local function _h495871(_stKUsV299O, instr, ctx)
  local b=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; local a=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; _stKUsV299O.sp=_stKUsV299O.sp+1; _stKUsV299O.stack[_stKUsV299O.sp]=tostring(a)..tostring(b)
end
local function _h322508(_stKUsV299O, instr, ctx)
  local val=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; local idx=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; local obj=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; obj[idx]=val
end
local function _h801146(_stKUsV299O, instr, ctx)
  local idx=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.sp=_stKUsV299O.sp-1; local obj=_stKUsV299O.stack[_stKUsV299O.sp]; _stKUsV299O.stack[_stKUsV299O.sp]=obj[idx]
end
local _hdDbF0KlLG = {}
_hdDbF0KlLG[249] = _h166828
_hdDbF0KlLG[228] = _h594139
_hdDbF0KlLG[241] = _h749559
_hdDbF0KlLG[233] = _h530284
_hdDbF0KlLG[252] = _h950750
_hdDbF0KlLG[254] = _h679839
_hdDbF0KlLG[232] = _h424712
_hdDbF0KlLG[250] = _h251172
_hdDbF0KlLG[242] = _h760601
_hdDbF0KlLG[227] = _h629654
_hdDbF0KlLG[243] = _h369260
_hdDbF0KlLG[231] = _h664681
_hdDbF0KlLG[238] = _h514640
_hdDbF0KlLG[246] = _h617581
_hdDbF0KlLG[251] = _h449526
_hdDbF0KlLG[244] = _h732436
_hdDbF0KlLG[240] = _h901178
_hdDbF0KlLG[236] = _h842721
_hdDbF0KlLG[229] = _h510588
_hdDbF0KlLG[230] = _h842969
_hdDbF0KlLG[248] = _h831930
_hdDbF0KlLG[239] = _h204213
_hdDbF0KlLG[226] = _h904002
_hdDbF0KlLG[247] = _h631363
_hdDbF0KlLG[235] = _h191239
_hdDbF0KlLG[245] = _h556319
_hdDbF0KlLG[234] = _h457935
_hdDbF0KlLG[253] = _h495871
_hdDbF0KlLG[237] = _h322508
_hdDbF0KlLG[225] = _h801146
_vmbdblwSpO = function(protoIdx, _enRHi2ZrEU, args)
  local proto = _psz8veuruW[protoIdx]
  local bc = proto.bc
  local _stKUsV299O = {sp=-1, pc=0, stack={}, locals={}, varargs=args or {}, halt=false, ret=nil}
  for i=1,proto.np or 0 do _stKUsV299O.locals[i-1]=_stKUsV299O.varargs[i] end
  while true do
    local instr = bc[_stKUsV299O.pc + 1]
    if instr == nil then break end
    _stKUsV299O.pc = _stKUsV299O.pc + 1
    _stKUsV299O.ret = nil
    local op = instr[1]
    local handler = _hdDbF0KlLG[op]
    if handler == nil then break end
    handler(_stKUsV299O, instr, {pIdx=protoIdx})
    if _stKUsV299O.halt then break end
    if _stKUsV299O.ret then return table.unpack(_stKUsV299O.ret) end
  end
  return nil
end
_vmbdblwSpO(0, _enRHi2ZrEU, {})
