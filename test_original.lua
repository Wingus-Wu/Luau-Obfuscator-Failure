local function get_subsets(set, index, current, result)
  index = index or 1
  current = current or {}
  result = result or {}

  if index > #set then
    table.insert(result, {table.unpack(current)})
    return result
  end

  -- Do not include current element
  get_subsets(set, index + 1, current, result)

  -- Include current element
  table.insert(current, set[index])
  get_subsets(set, index + 1, current, result)
  table.remove(current)

  return result
end

-- Example usage
local my_set = {1, 2, 3}
local all_subsets = get_subsets(my_set)

-- Print all subsets
for _, subset in ipairs(all_subsets) do
  print("{ " .. table.concat(subset, ", ") .. " }")
end