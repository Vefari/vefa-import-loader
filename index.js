'use strict'
const path = require('path');
const fs = require('fs');
const utils = require('loader-utils');
const yaml = require('js-yaml');
const matter = require('gray-matter');

module.exports = function(source){
    this.cacheable && this.cacheable();
    
    // lets load the shared locals object
    let loader = utils.getOptions(this);
    let locals = loader.locals; 

    const file_to_locals = (ref, dir) => {
        // read the data directory
        if (dir) {
            ref.forEach((file) => {
                // make sure its a yaml file
                if( file.includes('yaml') ||  file.includes('yml') ){
                    let file_name = file.split(".")[0]

                    if (file_name){
                        let data = path.resolve(`${dir}/${file}`)
                        this.addDependency( data )
                        let temp = yaml.safeLoad( fs.readFileSync(data, 'utf8') );

                        if (temp) {
                            locals[file_name] = temp
                        }
                    }
                }
            })
        }
    }

    const pages_to_locals = (ref, dir) => {
        // read the pages directory
        if (dir) {
            locals.pages = Object.create({})
            ref.forEach((file) => {
                // make sure its a yaml file
                if( file.includes('md') ||  file.includes('markdown') ){
                    let file_name = file.split(".")[0]

                    if (file_name){
                        let data = path.resolve(`${dir}/${file}`)
                        this.addDependency( data )
                        locals.pages[file_name] = matter(fs.readFileSync(data, 'utf8')).data;
                    }
                }
            })

        }
    }

    const file_to_json = (ref, dir) => {
        let output = loader.import.output
        if (output.dir) {
            // create json folder if it doesn't exist
            if (!fs.existsSync(output.dir)) {
                fs.mkdirSync (output.dir)
            }

            ref.forEach((file) => {
                if( file.includes('yaml') ||  file.includes('yml') ){
                    let data = path.resolve(`${dir}/${file}`)
                    this.addDependency( data )
                    
                    let file_name = file.split(".")[0]
                    let file_name_path = `${output.dir}/${file_name}.json`

                    if (!output.files || output.files.includes (file_name) ) {
                        fs.writeFileSync(
                            file_name_path, 
                            JSON.stringify (locals[file_name])
                        )
                    }
                }
            })
            
        }
    }
    
    if (!locals.load) {
        // get which config options to load
        // get the data property of that load configuration
        if (loader.import.data) {
            let data_dir = loader.import.data
            let data_ref = fs.readdirSync (data_dir)
            file_to_locals (data_ref, data_dir)
        }
        
        
        // get styles
        if (loader.import.styles) {
            let styles_dir = loader.import.styles
            let styles_ref = fs.readdirSync (styles_dir)
            file_to_locals (styles_ref, styles_dir)
            file_to_json (styles_ref, styles_dir)
        }
        

        // // get PAGES loader info, bypass if not there
        if (loader.import.pages) {
            let pages_dir = loader.import.pages
            let pages_ref = fs.readdirSync (pages_dir)
            pages_to_locals (pages_ref, pages_dir)
        }

        // trip load boolean so we don't run the loader for each source file, 
        // but only on initial compilation load
        locals.load = true;
    }

    return source;
}
