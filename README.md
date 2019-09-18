# json_schema
This is a dependency-free schema-based json validator designed to be used in browser

Supports the following data-types with their respective properties:

|Type|Useful properties|
|-|-|
|`number`| `minimum`, `maximum`, `enum`|
|`string`| `minLength`, `maxLength`, `pattern`, `enum`|
|`object`| `properties`|
|`array`| `minLength`, `maxLength`, `item_schema`, `enum`|

Every <u>schema</u> or <u>subschema</u> requires `type`.

Every schema has three common properties: `name`, `description` and `required`. It is a good practice to mention `name` and sufficient `description` for better feedback in case of errors. <br>

### Note:
1. `required`, `minimum`, `maximum`, `minLength`, `maxLength` and `enum` support callbacks but care should be taken while using them. If not provided default for `required` will be set to `false`.
2. item_schema is to be provided in case of `array` types, and the `item_schema` will be initialized for type mentioned in the `item_schema`.
3. `object` item_types are not checked for `uniqueItems` filter for `array` schemas.

## Usage:

### Step 1: Defining Schemas

#### Integer Schema

```javascript
let product_id = {
  "required": true,
  "description":"This is the id for each product",
  "name": "Product ID",
  "type": "number",
  "minimum": 1
}
```

#### String Schema

```javascript
let product_name = {
  "required": true,
  "description":"This is the name of each product",
  "name": "Product Name",
  "type": "string"
  "minLength": 3
}
```

#### Object Schema

```javascript
let product = {
  "name": "Product",
  "description": "This is the object schema of each product - contains all the properties of a product",
  "type": "object",
  "required": true,
  "properties": {
    "product_name": product_name,
    "product_id": product_id
  }
}
```

#### Array Schema

```javascript
let productSchema = {
  "name": "Products",
  "description": "Array of products",
  "required": true,
  "type": "array",
  "item_schema": product
}
```

### Step 2: Initializing the schema

```javascript
require('json_schema');

var mySchema = new Schema(productSchema)
    .then(res => res)
    .catch(err => {
        // some code to handle error
    })
```
Note:

`new Schema(schema)` returns a promise with all the values - default, defined.
The promise resolves with the instance of the class and rejects with an error object that is structured with nested error bodies for nested schemas contains a message about the error in schema that was passed.

### Step 3: Validating data objects

Call the `myScema.validate(data)` function which return a promise that can be handled appropriately

```javascript
try {
    var json_to_validate = [
      {product_name: "Guitar"}, 
      {product_name: "Piano", product_id: 1} 
    ];

    var result = mySchema.validate(json_to_validate)
      .then(res => {
          return res; 
          // returns true if valid json is passed
      })
      .catch(err => {
          return err;
          // return detailed error
      });
}
```
This would result into an error because the product_id is not specified for product "Guitar". <br>
`obj.validate(data)` returns the following error as a rejected promise
```javascript
{ root: 'Products',
  description: 'Array of products',
  title: 'Products failed due to the following reason(s) at position 0.',
  body: 
   { root: 'Product ID',
     description: 'This is the id for each product',
     title: 'Product should have the property product_id',
     body: { message: 'Product should have the property product_id' 
    } 
  } 
}
```
Pretty simple and neat, right?

### Advanced Usage:
#### Documentation for callback
> Coming soon
