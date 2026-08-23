export function handlerBody(op, v) {
    switch (op) {
        case 1: return "";
        case 2: return `${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=${v.cpPool}[${v.dispatchLua}]`;
        case 3: return `${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=${v.env}[${v.names}[${v.instr}[2]]]`;
        case 4: return `${v.env}[${v.names}[${v.instr}[2]]]=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1`;
        case 5: return `${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=${v.locals}[${v.instr}[2]]`;
        case 6: return `${v.locals}[${v.instr}[2]]]=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1`;
        case 7: return `${v.sp}=${v.sp}-${v.instr}[2]`;
        case 8: return `${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=${v.stack}[${v.sp}-1]`;
        case 9: return `local nargs=${v.instr}[2]
      local nresults=${v.instr}[3] or 1
      local fn=${v.stack}[${v.sp}-nargs]
      local callArgs={}
      for i=1,nargs do callArgs[i]=${v.stack}[${v.sp}-nargs+i] end
      ${v.sp}=${v.sp}-nargs-1
      local rets={fn(table.unpack(callArgs))}
      for i=1,nresults do ${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=rets[i] end`;
        case 10: return `local nargs=${v.instr}[2]
      local nresults=${v.instr}[3] or 1
      local methodName=${v.stack}[${v.sp}]
      ${v.sp}=${v.sp}-1
      local obj=${v.stack}[${v.sp}-nargs]
      local fn=obj[methodName]
      local callArgs={obj}
      for i=1,nargs do callArgs[i+1]=${v.stack}[${v.sp}-nargs+i] end
      ${v.sp}=${v.sp}-nargs-1
      local rets={fn(table.unpack(callArgs))}
      for i=1,nresults do ${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=rets[i] end`;
        case 11: return `local nret=${v.instr}[2]
      local rets={}
      for i=nret,1,-1 do
        rets[i]=${v.stack}[${v.sp}]
        ${v.sp}=${v.sp}-1
      end
      return rets`;
        case 12: return `${v.pc}=${v.instr}[2]`;
        case 13: return `local v=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1
      if not v then ${v.pc}=${v.instr}[2] end`;
        case 14: return `local v=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1
      if v then ${v.pc}=${v.instr}[2] end`;
        case 15: return `${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]={}`;
        case 16: return `local t=${v.stack}[${v.sp}-1]; local val=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; t[#t+1]=val`;
        case 17: return `local b=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; local a=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; ${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=tostring(a)..tostring(b)`;
        case 18: return `${v.stack}[${v.sp}]=#${v.stack}[${v.sp}]`;
        case 19: return `local b=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; local a=${v.stack}[${v.sp}]; ${v.stack}[${v.sp}]=${v.binOps}[${v.instr}[2]](a,b)`;
        case 20: return `${v.stack}[${v.sp}]=${v.unaryOps}[${v.instr}[2]](${v.stack}[${v.sp}])`;
        case 21: return `${v.stack}[${v.sp}]=${v.stack}[${v.sp}][${v.names}[${v.instr}[2]]]`;
        case 22: return `local obj=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; local val=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; obj[${v.names}[${v.instr}[2]]]=val`;
        case 23: return `local idx=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; local obj=${v.stack}[${v.sp}]; ${v.stack}[${v.sp}]=obj[idx]`;
        case 24: return `local val=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; local idx=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; local obj=${v.stack}[${v.sp}]; ${v.sp}=${v.sp}-1; obj[idx]=val`;
        case 25: return `${v.sp}=${v.sp}+1
      local _pi=${v.instr}[2]
      local _vmf=${v.vmName}
      ${v.stack}[${v.sp}]=function(...)
        local _args={...}
        local _rets=_vmf(_pi,${v.env},${v.stack})
        if _rets then return table.unpack(_rets) end
        return nil
      end`;
        case 26: return "";
        case 27: return `for i=1,#state.varargs do ${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=state.varargs[i] end`;
        case 28: return `${v.sp}=${v.sp}+1; ${v.stack}[${v.sp}]=nil`;
        case 29: return "state.__halt=true";
        default: return "";
    }
}
export function formatHandlerBody(op, v) {
    return handlerBody(op, v);
}
