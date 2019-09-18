
class Schema {    
    constructor(_schema) {
      return new Promise((resolve, reject) => {
        this.wrapper(_schema)
        .then(res => {
          delete(this.response);
          resolve(this);
        })
        .catch(err => {
          reject(this.response);
        })
      });
    }
    async wrapper(_schema) {
      this.response = {};
      this.response.status = true;
      this.response.errors = []
      // number, string, array, object, date - optional

      // init a this.error var whenever encounter an error
      // later reject the _schema with this.error

      _schema.name != undefined ? this.name = _schema.name: undefined;
      _schema.description != undefined ? this.description = _schema.description: " " ;

      // check if this.required is a function during calling
      // refer to end of this page for help on implementation
      
      _schema.required != undefined ? this.required = _schema.required: false;      
      _schema.type != undefined? this.type = _schema.type : undefined;

      if(this.type == undefined) {
        this.response.status = false;
        this.response.errors.push(this.errorBody(
          `Type for ${this.name} is not specified`,
          { message: `Type for ${this.name} is not specified`, }));

      } else if(this.type == "number") {
          // look for minimum and maximum

          // set default behaviour
          _schema.minimum != undefined ? this.minimum = _schema.minimum : undefined;
          _schema.maximum != undefined ? this.maximum = _schema.maximum : undefined;

      } else if(this.type == "string") {
          // we have patterns
          // we have min-length, max-lenght
          // we have enum values

          // set default behaviour
          _schema.pattern != undefined ? this.pattern = _schema.pattern : undefined;
          _schema.enum != undefined ? this.enum = _schema.enum : undefined;
          _schema.minLength != undefined ? this.minLength = _schema.minLength : undefined;
          _schema.maxLength != undefined ? this.maxLength = _schema.maxLength : undefined;

      } else if(this.type == "array") {
        // we have items and their type
        // we may have enums
        // we have minItems, maxItems
        // we may have unique
        this.items = [];
        _schema.enum != undefined ? this.enum = _schema.enum : undefined;

        if(_schema.item_schema == undefined) {
          this.response.status = false;
          this.response.errors.push(this.errorBody(
            `item_schema is not specified for ${this.name}'s items.`,
            { message: `item_schema is not specified for ${this.name}'s items.`, }));
        } else {
          
          this.item_schema =  await new Schema(_schema.item_schema)
            .then((res) => {
                // console.log(res);
                this.item_type = _schema.item_schema.type;
                return res;
            })
            .catch((err) => {
                // console.log(err);
              this.response.status = false;
              this.response.errors.push(this.errorBody(
                `item_schema for ${this.name} has the following errors.`, err));
              });
        }
        
        // set default behaviour
        _schema.uniqueItems != undefined ? this.uniqueItems = _schema.uniqueItems: false;
        _schema.minItems != undefined ? this.minItems = _schema.minItems : undefined;
        _schema.maxItems != undefined ? this.maxItems = _schema.maxItems : undefined;

      } else if(this.type == "object") {
          this.schemas = [];
          this.properties = {};
          // create self object for each key and store into this.schemas 
          if(_schema.properties != undefined) {
              let i = 0;
              for (var key in _schema.properties) {
                  this.properties[key] = i;
                  const child = await new Schema(_schema.properties[key])
                    .then((res) => {
                      // do NOT return yet
                        return res;
                    }).catch((err) => {
                        // console.log(err);
                        this.response.status = false;
                        this.response.errors.push(err);
                    });
        
                  // Caution: This may not work because the promise takes time to resolve
                  if(this.response.status == true) this.schemas.push(child);
                  // console.log(this);
                  i++;
              }
          } else {
              this.response.status = false;
              this.response.errors.push(this.errorBody(
                `Could not find properties for object schema ${this.name}`,
                { message: `Could not find properties for object schema ${this.name}`,}));
          }
      } else {
        // return error
          this.response.status = false;
          this.response.errors.push(this.errorBody(
            `Not a permissible data-type for ${this.name}`,
            { message: `Not a permissible data-type for ${this.name}`}));
      }

      // common enum operations
      if(["string", "number", "array"].includes(this.type)) {
        _schema.enum != undefined? this.enum = _schema.enum : undefined;
        if(this.enum != undefined) {
          this.permittedValues = {};
          for (var item in this.enum) {
            this.permittedValues[`${this.enum[item]}`] = 1;
          }
        }
      }
      // return a success promise, resolved by `this`.
      if(this.response.status == true) 
        return new Promise((resolve, reject) => {
          resolve();
        });
      else return new Promise((resolve, reject) => {
          reject();
        });
  
    }
    errorBody(title, body) {
      return {
        root: this.name,
        description: this.description,
        title: title,
        body : body
      }
    }
    async validate(data, _root, _key) {
        // validate only numbers, strings, arrays directly
        // we handle objects through recursion
        // console.log(data, _root, _key)
        
        typeof(this.required) == "function"? this.required = this.required(_root, _key): '';
        if(this.required) {
          if(!data) {
            return new Promise((resolve, reject) => {
              reject(this.errorBody(`${this.name} is required`, {message: `${this.name} is required`}));
            });
          }
        } else {
          // 
          // if not required and no data is provided, then resolve
          if(!data) return new Promise((resolve, reject) => {
            resolve();
          });
        }

        if( this.type == "number" && typeof(data) == "number") { 
            typeof(this.minimum) == "function"? this.minimum = this.minimum(_root, _key): undefined;
            // console.log(this.minimum, this.maximum)
            if(this.minimum && this.minimum > data) 
                return new Promise((resolve, reject) => {
                  reject(this.errorBody(
                    `Value of '${this.name}' can have minimum value equal to ${this.minimum}.`,
                    { message: `Value of '${this.name}' can have minimum value equal to ${this.minimum}.`}));
                });
            typeof(this.maximum) == "function"? this.maximum = this.maximum(_root, _key): undefined;
            if(this.maximum && this.maximum < data)
              return new Promise((resolve, reject) => {
                reject(this.errorBody(
                  `Value of '${this.name}' can have maximum value equal to ${this.maximum}.`,
                  { message: `Value of '${this.name}' can have maximum value equal to ${this.maximum}.`}));
              });
    
            // check for enum later, that's why not returning true yet
    
        } else if(this.type == "string" && typeof(data) == "string") {

              typeof(this.maxLength) == "function"? this.maxLength =  this.maxLength(_root, _key): '';
              if(this.maxLength && data.length > this.maxLength)
                return new Promise((resolve, reject) => {
                  reject(this.errorBody(
                    `'${this.name}' can have maximum length equal to ${this.maxLength}.`,
                    { message: `'${this.name}' can have maximum length equal to ${this.maxLength}.`}));
                });

              typeof(this.minLength) == "function"? this.minLength =  this.minLength(_root, _key): '';
              if(this.minLength && data.length < this.minLength)
              return new Promise((resolve, reject) => {
                reject(this.errorBody(
                  `'${this.name}' can have minimum length equal to ${this.minLength}.`,
                  { message: `'${this.name}' can have minimum length equal to ${this.minLength}.`}));
              });

            if(this.pattern && !data.match(this.pattern) )
                return new Promise((resolve, reject) => {
                  reject(this.errorBody(
                    `'${this.name}' does not match the required pattern.`,
                    { message: `'${this.name}' does not match the required pattern.`}));
                });

            // check for enum later, that's why not returning true yet
    
        } else if(this.type == "array" && Array.isArray(data)) {
            // minItems, maxItems
            // console.log(_key);
            typeof(this.maxItems) == "function"? this.maxItems =  this.maxItems(_root, _key): '';

            if(this.maxItems && data.length > this.maxItems)
                return new Promise((resolve, reject) => {
                  reject(this.errorBody(
                    `'${this.name}' can have maximum length equal to ${this.maxLength}.`,
                  { message: `'${this.name}' can have maximum length equal to ${this.maxItems}.`}));
                });

            typeof(this.minItems) == "function"? this.minItems =  this.minItems(_root, _key): '';
            
              if(this.minItems && data.length < this.minItems)
                return new Promise((resolve, reject) => {
                  reject(this.errorBody(
                    `'${this.name}' can have minimum length equal to ${this.minItems}.`,
                    { message: `'${this.name}' can have minimum length equal to ${this.minItems}.`}));
                });
            // each item
            for(var item in data) {
              // console.log(data)
                await this.item_schema.validate(data[item], _root, item)
                .then()
                .catch(err => {
                  console.log(err)
                    return new Promise((resolve, reject) => {
                      reject(this.errorBody(
                        `${this.name} failed due to the following reason(s) at position ${item}.`, err));
                    });
                })
            }

            // unique values when item_type is not an object
            if(this.item_type != "object" && this.uniqueItems) {
              var values_seen = {}
              for(var item in data)
                if(values_seen.hasOwnProperty(data[item])) 
                    return new Promise((resolve, reject) => {
                      reject(this.errorBody(
                        `'${data[item]}' should be unique in ${this.name} at position ${item}.`,
                      { message: `'${data[item]}' should be unique in ${this.name} at position ${item}.`}));
                    });
                else values_seen[`${data[item]}`] = 1;
            }
            // check for enum later, that's why not returning true yet
    
        } else if(this.type == "object" && typeof(data) == typeof({})) {
            for (var key in this.properties) {
              // check if data hasOwnProperty(key)
              var t = this.schemas[this.properties[key]].required;
              if(typeof(t) == "function") t = t(_root, _key);
                if(!data.hasOwnProperty(key) && t) {
                    // return reject promise
                    return new Promise((resolve, reject) => {
                      reject({
                        root: this.schemas[this.properties[key]].name,
                        description: this.schemas[this.properties[key]].description,
                        title: `${this.name} should have the property ${key}`,
                        body: { message: `${this.name} should have the property ${key}`}
                      });
                    });
                }
    
                await this.schemas[this.properties[key]].validate(data[key], _root, _key)
                .then((res)=> {
                  // do nothing as other keys are to be checked
                  // console.log(res);
                }).catch((err) => {
                    console.log(err)
                    return new Promise((resolve, reject) => {
                      reject(this.errorBody(
                        `${this.name} failed at the property ${key}`, err));
                    });
                });
            }
        } else return new Promise((resolve, reject) => {
            reject(this.errorBody(
              `Invalid type at ${this.name}.`,
            { message: `Invalid type at ${this.name}.`}));
        });
    
        // common enum operations
        if(["string", "number"].includes(this.type)) {
          if(this.enum != undefined) {
              if(typeof(this.enum) == "function") {
                this.enum = this.enum(_root);
                // console.log(this.enum)
                this.permittedValues = {};
                for (var item in this.enum) {
                  this.permittedValues[`${this.enum[item]}`] = 1;
                }
                // console.log(this.permittedValues)
              }
          }
        }
        // check for common enum operations
        if(this.type != "object") {
          if(this.enum != undefined)  {
            // console.log(this.enum)
            // checking strings and numbers
            if(this.type != "array") {
              if(!this.permittedValues.hasOwnProperty(data)) 
                  return new Promise((resolve, reject) => {
                      reject(this.errorBody(
                        `${this.name} does not have a permissible value.`,
                      { message: `${this.name} should have one of the following values: ${this.enum.toString()}.`}));
                  });
            }
          }
        }

        // data passed all tests
        return new Promise((resolve, reject) => {
          resolve(true);
        });
    }
}
