'use strict'
const path = require('path');
const fs = require('fs');
const utils = require('loader-utils');
const yaml = require('js-yaml');
const matter = require('gray-matter');

module.exports = function(source){
    this.cacheable && this.cacheable();
    
    // lets load the shared locals object
    let locals = this.options.locals; 

    if (!locals.load) {
        
        // get which config options to load
        let loader = utils.getLoaderConfig(this, "import");
        // get the data property of that load configuration
        let dir = loader.data;
        // read the data directory
        let ref = fs.readdirSync(dir);

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
                if (loader.json.dir) {
                    // create json folder if it doesn't exist
                    if (!fs.existsSync(loader.json.dir)){
                        fs.mkdirSync(loader.json.dir);
                    }
                    if (!loader.json.output) {
                        fs.writeFileSync(
                            `${loader.json.dir}/${file_name}.json`, 
                            JSON.stringify(locals[file_name])
                        );
                    } 
                    else if (loader.json.output.includes(file_name)) {
                        fs.writeFileSync(
                            `${loader.json.dir}/${file_name}.json`, 
                            JSON.stringify(locals[file_name])
                        );
                    }
                }
            }
        }

        // get PAGES loader info, bypass if not there
        loader = utils.getLoaderConfig(this, "pages");
        dir = loader.context;
        if (dir) {
            ref = fs.readdirSync(dir);
            locals.pages = {};
            
            for (let i = 0, len = ref.length; i < len; i++) {
                let file = ref[i];
                let file_name = file.split(".")[0];
                if( file_name ){
                    let data = path.resolve(`${dir}/${file}`)
                    this.addDependency( data );
                    locals.pages[file_name] = matter(fs.readFileSync(data, 'utf8')).data;
                }
            }
        }

        // trip load boolean so we don't run the loader for each source file, 
        // but only on initial compilation load
        locals.load = true;
    }

    return source;
}
