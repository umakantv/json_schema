# json_schema
This is a dependency-free schema-based json validator designed to be used in browser

Supports the following data-types with their respective flags
1. `number` - minimum, maximum
2. `string` - minLength, maxLength, patterns
3. `array` - minLength, maxLength, items, item_type, uniqueItems
4. `object` - They are nested schemas with the above three base types or another objects as their properties

> `required` is a common flag for all types with default set to `false`, and it supports callback functions

> Note:
> 1. item_schema is to be provided in case of `array` types, and the `item_schema` will be initialized for type mentioned in the `item_schema` and not by `item_type`
> 2. `object` item_types are not checked for `uniqueItems` filter

## Usage:
Initialize the class instance `obj` with valid schema. 

For example:
```javascript
require('json_schema')

productSchema = {
  "name": "Products",
  "description": "Testing type",
  "required": true,
  "type": "array",
  "item_type": "object",
  item_schema: {
    name: "Product",
    type: "object",
    required: true,
    properties: {
      product_name: {
        required: true,
        name: "Product Name",
        type: "string"
      },
      product_id: {
        required: true,
        name: "Product ID",
        type: "number"
      }
    }
   }
}

var mySchema = new Schema(productSchema)
    .then(res => res)
    .catch(err => {
        // some code to handle error
    })
```
> Note:
>
> `new Schema(schema)` returns a promise with all the values - default, defined. The promise resolves with the instance of the class and rejects with an error object that is structured with nested error bodies for nested schemas contains a message about the error in schema that was passed

Call the `obj.validate(data)` function which return a promise that can be handled appropriately

For example:
```javascript
try {
    var json_to_validate = [{product_name: "Guitar"}, {product_name: "Piano", product_id: 1} ];
    mySchema.validate(json_to_validate)
        .then(res => {
            return res; 
            // returns true if valid json is passed
        })
        .catch(err => {
            // some code to handle error
        })
}
```
## To Do: 
0. Redefine how item_type for an array is handled - reduce redundancy
1. Have to distinguish between integers and floating point
3. Distinguish between array and objects in array validation Or probably not
2. Custom message for Required flag
4. Export module
3. Error promises for validatation
