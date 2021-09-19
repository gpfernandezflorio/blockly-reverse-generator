Main = {
  blockly : undefined,
  idioma : 'es',
  codigos : {
    js : 'var result = [];\n\
function fibonacci(n, output) {\n\
  var a = 1, b = 1, sum;\n\
  for (var i = 0; i < n; i++) {\n\
    output.push(a);\n\
    sum = a + b;\n\
    a = b;\n\
    b = sum;\n\
  }\n\
}\n\
fibonacci(16, result);\n\
alert(result.join(\', \'));'
  }
};

// Inicializa todo lo necesario antes de que se termine de cargar la página
Main.preCarga = function() {
  document.write(`<script charset="utf-8" src="blockly/msg/js/${Main.idioma}.js"></script>\n`);
};

// Inicializa todo lo necesario una vez que se termina de cargar la página
Main.inicializar = function() {
  window.addEventListener('resize', Main.redimensionar, false);   // Al cambiar el tamaño de la pantalla
  Main.establecerInputUsuario(Main.codigos.js);
  Main.redimensionar();
  //Main.generarBloques();
};

Main.generarBloques = function() {
  let codigo = document.getElementById('input_usuario').value;
  let interprete;
  try {
    interprete = new Interpreter(codigo, function() {});
  } catch (error) {
    Main.error("Código inválido");
    return;
  }
  Main.crearBloques(interprete.fa);
  document.getElementById('output_blockly').innerHTML =
  Blockly.JavaScript.workspaceToCode(Blockly.mainWorkspace);
};

Main.crearBloques = function(ast) {
  console.log(ast);
  if (Main.blockly) {
    Main.blockly.dispose();
  }
  Main.blockly = Blockly.inject('blockly', {readOnly: true});
  Bloques.iniciar();
  Main.bloques = [];
  // Primero parséo todo
  for (let bloque_top of ast.body) {
    let nuevo_bloque = Bloques.crearXmlBloque(bloque_top);
    if (nuevo_bloque) {
      Main.bloques.push(nuevo_bloque);
    }
  }
  Bloques.finalizar();
  let h = 10;
  // Ahora sí, creo los bloques
  for (let bloque of Main.bloques) {
    let nuevo_bloque = Blockly.Xml.domToBlock(bloque, Blockly.mainWorkspace);
    if (nuevo_bloque) {
      nuevo_bloque.moveTo({x:10, y:h});
      h = 10 + nuevo_bloque.getBoundingRectangle().bottom;
    }
  }
  delete Main.bloques;
};

Main.bloqueAdicional = function(bloque) {
  Main.bloques.push(bloque);
};

Main.mapaBloques = {
  ArrayExpression: {
    tipoBloque : 'lists_create_with',
    f : function(bloque, ast) {
      if ('elements' in ast) {
        bloque.itemCount_ = ast.elements.length;
        bloque.updateShape_();
        for (let i=0; i<ast.elements.length; i++) {
          let nuevo_bloque = Main.crearBloque(ast.elements[i]);
          if (nuevo_bloque) {
            bloque.getInput(`ADD${i}`).connection.connect(nuevo_bloque.outputConnection);
          }
        }
      } else {
        Main.error("No sé cómo inicializar la lista");
      }
    }
  }
};

Main.redimensionar = function() {
  const offset_vertical = 15;
  const offset_horizontal = 40;
  const porcentaje_codigo = 40;
  let porcentaje_bloques = 100 - porcentaje_codigo;
  let altura = window.innerHeight-document.getElementById('barra_navagacion').offsetHeight-offset_vertical;
  let ancho_codigo = window.innerWidth*porcentaje_codigo/100;
  document.getElementById('area_texto').style.height = `${altura}px`;
  document.getElementById('area_texto').style.width = `${ancho_codigo}px`;
  document.getElementById('area_blockly').style.height = `${altura}px`;
  document.getElementById('area_blockly').style.width = `${window.innerWidth - ancho_codigo - offset_horizontal}px`;

  const offset_codigo = 10;
  const porcentaje_input = 40;
  let porcentaje_output = 100 - porcentaje_input;
  let altura_input = altura*porcentaje_input/100;
  let altura_output = altura - altura_input - 10;
  document.getElementById('div_input_usuario').style.height = `${altura_input}px`;
  document.getElementById('div_output_blockly').style.height = `${altura_output}px`;
  document.getElementById('input_usuario').style.height = `${altura_input - document.getElementById('barra_navagacion_input').offsetHeight}px`;
  document.getElementById('output_blockly').style.height = `${altura_output - document.getElementById('barra_navagacion_output').offsetHeight}px`;
};

Main.establecerInputUsuario = function(texto) {
  document.getElementById('input_usuario').innerHTML = texto;
};

Main.ejecutarEntrada = function() {
  eval(document.getElementById('input_usuario').value);
};

Main.ejecutarSalida = function() {
  eval(document.getElementById('output_blockly').value);
};

Main.error = function(msg) {
  console.log("Error: " + msg);
};

// Antes de terminar de cargar la página, llamo a esta función
Main.preCarga();

// Cuando se termina de cargar la página, llamo a inicializar
window.addEventListener('load', Main.inicializar);
