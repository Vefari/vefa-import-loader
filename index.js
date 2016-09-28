const utils = require('loader-utils');
const path = require('path');
const fs = require('fs');

module.exports = function(source){
    this.cacheable && this.cacheable();
    
    // get which config options to load
    let loader = utils.getLoaderConfig(this, "import");
    
    // get the data property of that load configuration
    let dir = loader.data;

    // read the data directory
    let ref = fs.readdirSync(dir);
    
    // lets load the shared locals object
    let locals = this.options.locals; 
    
    // parse through the data files and add them to the locals object
    for (let i = 0, len = ref.length; i < len; i++) {
        let file = ref[i];
        let file_name = file.split(".")[0];

        if( file_name ){
            let data = path.resolve(`${dir}/${file}`)
            this.addDependency( data );
            let temp = yaml.safeLoad( fs.readFileSync(data, 'utf8') );
            
            if (Array.isArray(temp)) {
                locals[file_name] = temp;
            }
            else {
                locals[file_name] = {};
                for (let key in temp) {
                    locals[file_name][key] = temp[key];
                }
            }

            // output to a "json" directory for use elsewhere
            if (loader.json) {
                fs.writeFileSync(
                    `${loader.json}/${file_name}.json`, 
                    JSON.stringify(locals[file_name])
                );
            }
        }
    }

    return source;
}
