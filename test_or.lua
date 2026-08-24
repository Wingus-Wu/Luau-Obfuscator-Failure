-- Test case for "or" default parameter pattern
local function test_defaults(a, b, c)
  a = a or 10
  b = b or 20
  c = c or 30
  return a + b + c
end

print(test_defaults())        -- should print 60
print(test_defaults(1))       -- should print 51
print(test_defaults(1, 2))    -- should print 33
print(test_defaults(1, 2, 3)) -- should print 6