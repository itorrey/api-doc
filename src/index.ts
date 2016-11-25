import {
	createCompilerHost,
	createProgram,
	CompilerOptions,
	ModuleKind,
	ModuleResolutionKind,
	ScriptTarget
} from 'typescript';
import convert from './generator/convert';
import * as glob from 'glob';
import { join } from 'path';
import * as fs from 'fs';
import * as pkgDir from 'pkg-dir';
const Handlebars = require('handlebars');
import * as handlebarsHelpers from '../templates/helpers';

const projectDir = pkgDir.sync(__dirname);

glob(join(__dirname, '../../../core/src/**/*.ts'), { realpath: true } , (err, files) => {
	if (err) {
		throw err;
	}

	// console.log(files);

	function clean(filename: string) {
		try {
			fs.unlinkSync(filename);
		} catch (err) {
			// noop
		}
	}

	function setupHandlebars(): any{
		const templateFile = fs.readFileSync(templateFileName);

		Handlebars.registerPartial('sidebar', compilePartial('sidebar'));

		Handlebars.registerHelper(handlebarsHelpers.switch);
		Handlebars.registerHelper(handlebarsHelpers.case);
		Handlebars.registerHelper(handlebarsHelpers.default);
		return Handlebars.compile(templateFile.toString());

		function compilePartial(name: string): any{
			const partialFile = fs.readFileSync(join(projectDir, '/templates/partials/', `${name}.handlebars`));
			return Handlebars.compile(partialFile.toString());
		}
	}

	const compilerOptions: CompilerOptions = {
		lib: [
			'lib.dom.d.ts',
			'lib.es5.d.ts',
			'lib.es2015.iterable.d.ts',
			'lib.es2015.symbol.d.ts',
			'lib.es2015.symbol.wellknown.d.ts',
			'lib.es2015.promise.d.ts'
		],
		module: ModuleKind.UMD,
		moduleResolution: ModuleResolutionKind.NodeJs,
		project: '../compose',
		target: ScriptTarget.ES5
	};


	const templateFileName = join(projectDir, './templates/myTemplate.handlebars');
	const outputHTMLFileName = join(projectDir, './output/output.html');

	clean(outputHTMLFileName);

	const host = createCompilerHost(compilerOptions);
	const program = createProgram(files, compilerOptions, host);

	const results = convert(files, program);
	// console.log(JSON.stringify(results.results, undefined, '  '));

	const template = setupHandlebars();
	const html = template({'results' : results.results});
	fs.writeFileSync(outputHTMLFileName, html);

});
