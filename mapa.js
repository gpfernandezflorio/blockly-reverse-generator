Bloques.mapaBloques = {};

Bloques.mapaBloques.VariableDeclaration = function(ast) {
  if ('declarations' in ast) {
    let primero;
    let anterior;
    for (let declaracion of ast.declarations) {
      let nombre;
      let valor;
      let hijos = [];
      if ('id' in declaracion) {
        if ('name' in declaracion.id) {
          nombre = declaracion.id.name;
        }
      }
      if ('init' in declaracion) {
        valor = Bloques.crearXmlBloque(declaracion.init);
      }
      if (nombre) {
        let campo_nombre = Bloques.domCampo('VAR', nombre);
        campo_nombre.setAttribute('id', Bloques.obtenerIdVariable(nombre));
        hijos.push(campo_nombre);
      } else {
        alert("No sé cuál es el nombre de la variable");
      }
      if (valor) {
        hijos.push(Bloques.domInput('VALUE', valor));
      } else {
        //alert("No sé cuál es la definición de la variable");
      }
      let nuevo_bloque = Bloques.domBloque('variables_set', hijos);
      if (primero) {
        Bloques.conectar(anterior, nuevo_bloque);
      } else {
        primero = nuevo_bloque;
      }
      anterior = nuevo_bloque;
    }
    return primero;
  }
  alert("No sé qué asignarle a la variable");
  return Bloques.domBloque('variables_set', []);
};

Bloques.mapaBloques.ArrayExpression = function(ast) {
  let hijos = [];
  if ('elements' in ast) {
    hijos.push(Bloques.domMutador({items: ast.elements.length}, []));
    for (let i=0; i<ast.elements.length; i++) {
      hijos.push(Bloques.domInput(`ADD${i}`, Bloques.crearXmlBloque(ast.elements[i])));
    }
  }
  return Bloques.domBloque('lists_create_with', hijos);
};

Bloques.mapaBloques.Literal = function(ast) {
  let campo_valor = Blockly.utils.xml.createElement('field');
  let tipo = 'math_number';
  if ('raw' in ast) {
    if (['true','false'].includes(ast.raw)) {
      tipo = 'logic_boolean';
      Bloques.establecerCampo(campo_valor, 'BOOL', ast.raw.toUpperCase());
    } else if (Bloques.esUnString(ast.raw)) {
      tipo = 'text';
      if ('value' in ast) {
        Bloques.establecerCampo(campo_valor, 'TEXT', ast.value);
      } else {
        alert("No sé qué texto asignar");
      }
    }
  }
  if (tipo == 'math_number') {
    if ('value' in ast) {
      Bloques.establecerCampo(campo_valor, 'NUM', ast.value);
    } else {
      alert("No sé qué número asignar");
    }
  }
  return Bloques.domBloque(tipo, [campo_valor]);
};

Bloques.mapaBloques.FunctionDeclaration = function(ast) {
  let tipo = 'procedures_defnoreturn';
  if (Bloques.esFuncion(ast)) {
    tipo = 'procedures_defreturn';
  }
  let nombre;
  let cuerpo;
  let hijos = [];
  let parametros = [];
  if ('id' in ast) {
    if ('name' in ast.id) {
      nombre = ast.id.name;
    }
  }
  if ('params' in ast) {
    for (let parametro of ast.params) {
      if ('name' in parametro) {
        Bloques.registrarParametro(nombre, parametro.name);
        parametros.push(Bloques.domGenerico('arg', parametro.name));
      }
    }
  }
  if ('body' in ast) {
    cuerpo = Bloques.crearXmlBloque(ast.body);
  }
  if (nombre) {
    hijos.push(Bloques.domCampo('NAME', nombre));
  }
  if (parametros.length > 0) {
    hijos.push(Bloques.domMutador({}, parametros));
  }
  if (cuerpo) {
    hijos.push(Bloques.domStatement('STACK', cuerpo));
  }
  return Bloques.domBloque(tipo, hijos);
};

Bloques.mapaBloques.ExpressionStatement = function(ast) {
  let tipo = 'procedures_callnoreturn';
  let nombre;
  let hijos = [];
  let argumentos = [];
  if ('expression' in ast) {
    if ('callee' in ast.expression) {
      if ('name' in ast.expression.callee) {
        nombre = ast.expression.callee.name;
      }
    }
    if ('arguments' in ast.expression) {
      let i=0;
      for (let argumento of ast.expression.arguments) {
        let dom = Bloques.domGenerico('arg', null);
        let j=i;
        Bloques.hacerAlFinal(function() {
          dom.setAttribute('name', Bloques.parametroRegistrado(nombre, j));
        });
        argumentos.push(dom);
        i++;
      }
    }
  }
  hijos.push(Bloques.domMutador({name: nombre}, argumentos));
  return Bloques.domBloque(tipo, hijos);
};

Bloques.mapaBloques.ForStatement = function(ast) {
  return Bloques.domBloque('controls_for', []);
};

Bloques.mapaBloques.BlockStatement = function(ast) {
  if ('body' in ast) {
    let cuerpo = ast.body;
    if (Array.isArray(cuerpo)) {
      let primero;
      let anterior;
      for (let bloque of cuerpo) {
        let nuevo_bloque = Bloques.crearXmlBloque(bloque);
        if (nuevo_bloque) {
          if (primero) {
            Bloques.conectar(anterior, nuevo_bloque);
          } else {
            primero = nuevo_bloque;
          }
          anterior = nuevo_bloque;
        }
      }
      return primero;
    }
  }
};
