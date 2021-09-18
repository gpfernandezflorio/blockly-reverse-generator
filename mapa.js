Bloques.mapaBloques = {};

Bloques.mapaBloques.VariableDeclaration = function(ast, opciones={}) {
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
        valor = Bloques.crearXmlBloque(declaracion.init, {expresion: true});
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
        let nuevo_bloque = Bloques.domBloque('variables_set', hijos);
        if (primero) {
          Bloques.conectar(anterior, nuevo_bloque);
        } else {
          primero = nuevo_bloque;
        }
        anterior = nuevo_bloque;
      } else {
        //alert("No sé cuál es la definición de la variable");
        // ¡No hace falta declararla!
      }
    }
    return primero;
  }
  alert("No sé qué asignarle a la variable");
  return Bloques.domBloque('variables_set', []);
};

Bloques.mapaBloques.ArrayExpression = function(ast, opciones={}) {
  let hijos = [];
  if ('elements' in ast) {
    hijos.push(Bloques.domMutador({items: ast.elements.length}, []));
    for (let i=0; i<ast.elements.length; i++) {
      hijos.push(Bloques.domInput(`ADD${i}`, Bloques.crearXmlBloque(ast.elements[i], {expresion: true})));
    }
  }
  return Bloques.domBloque('lists_create_with', hijos);
};

Bloques.mapaBloques.Literal = function(ast, opciones={}) {
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

Bloques.mapaBloques.FunctionDeclaration = function(ast, opciones={}) {
  let tipo = 'procedures_defnoreturn';
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
    cuerpo = Bloques.crearXmlBloque(ast.body, {statement: true});
  }
  if (nombre) {
    hijos.push(Bloques.domCampo('NAME', nombre));
    if (Bloques.esFuncion(ast)) {
      Bloques.registrarFuncion(nombre);
      tipo = 'procedures_defreturn';
    } else {
      Bloques.registrarProcedimiento(nombre);
    }
  }
  if (parametros.length > 0) {
    hijos.push(Bloques.domMutador({}, parametros));
  }
  if (cuerpo) {
    hijos.push(Bloques.domStatement('STACK', cuerpo));
  }
  return Bloques.domBloque(tipo, hijos);
};

Bloques.mapaBloques.ExpressionStatement = function(ast, opciones={}) {
  if ('expression' in ast) {
    return Bloques.crearXmlBloque(ast.expression, opciones);
  }
  alert("No sé cómo procesar esta expresión");
  return null;
};

Bloques.mapaBloques.CallExpression = function(ast, opciones={}) {
  let tipo = 'procedures_callnoreturn';
  let nombre;
  let hijos = [];
  let argumentos = [];
  if ('callee' in ast) {
    let callee = ast.callee;
    if ('type' in callee && callee.type !== 'Identifier') {
      // Entonces no es un llamado a una función
      return Bloques.procesarInvocacionCompleja(callee.type, callee, ast);
    }
    if ('name' in callee) {
      nombre = callee.name;
      if (nombre == 'alert') {
        return Bloques.alert(ast);
      }
    }
  }
  if ('arguments' in ast) {
    let i=0;
    for (let argumento of ast.arguments) {
      let dom = Bloques.domGenerico('arg', null);
      let nuevo_bloque = Bloques.crearXmlBloque(argumento, {expresion: true});
      if (nuevo_bloque) {
        hijos.push(Bloques.domInput(`ARG${i}`, nuevo_bloque));
      }
      let j=i;
      Bloques.hacerAlFinal(function() {
        dom.setAttribute('name', Bloques.parametroRegistrado(nombre, j));
      });
      argumentos.push(dom);
      i++;
    }
  }
  hijos.push(Bloques.domMutador({name: nombre}, argumentos));
  if ('expresion' in opciones) {
    tipo = 'procedures_callreturn';
  }
  let resultado = Bloques.domBloque(tipo, hijos);
  if (nombre) {
    Bloques.hacerAlFinal(function() {
      if (Bloques.funcionRegistrada(nombre)) {
        resultado.setAttribute('type', 'procedures_callreturn');
      } else if (Bloques.procedimientoRegistrado(nombre)) {
        resultado.setAttribute('type', 'procedures_callnoreturn');
      }
    });
  }
  return resultado;
};

Bloques.mapaBloques.AssignmentExpression = function(ast, opciones={}) {
  let nombre;
  let valor;
  let hijos = [];
  if ('left' in ast) {
    if ('name' in ast.left) {
      nombre = ast.left.name;
    }
  }
  if ('right' in ast) {
    valor = Bloques.crearXmlBloque(ast.right, {expresion: true});
  }
  if (nombre) {
    let campo_nombre = Bloques.domCampo('VAR', nombre);
    campo_nombre.setAttribute('id', Bloques.obtenerIdVariable(nombre));
    hijos.push(campo_nombre);
  }
  if (valor) {
    hijos.push(Bloques.domInput('VALUE', valor));
  }
  if ('operator' in ast) {
    if (ast.operator == '=') {
      return Bloques.domBloque('variables_set', hijos);
    }
  }
  return null;
};

Bloques.mapaBloques.ForStatement = function(ast, opciones={}) {
  let cuerpo;
  let contador;
  let desde;
  let hasta;
  let paso;
  let hijos = [];
  if ('body' in ast) {
    cuerpo = Bloques.crearXmlBloque(ast.body, {statement: true});
  }
  if ('init' in ast) {
    contador = Bloques.obtenerContadorFor(ast.init);
    desde = Bloques.obtenerInicioFor(ast.init);
  }
  if (contador != null && 'test' in ast) {
    hasta = Bloques.obtenerLimiteFor(ast.test, contador);
  }
  if (contador != null && 'update' in ast) {
    paso = Bloques.obtenerPasoFor(ast.update, contador);
  }
  if (cuerpo) {
    hijos.push(Bloques.domStatement('DO', cuerpo));
  }
  if (contador) {
    let campo_nombre = Bloques.domCampo('VAR', contador);
    campo_nombre.setAttribute('id', Bloques.obtenerIdVariable(contador));
    hijos.push(campo_nombre);
  }
  if (desde) {
    hijos.push(Bloques.domInput('FROM', desde));
  }
  if (hasta) {
    hijos.push(Bloques.domInput('TO', hasta));
  }
  if (paso) {
    hijos.push(Bloques.domInput('BY', paso));
  }
  return Bloques.domBloque('controls_for', hijos);
};

Bloques.mapaBloques.BlockStatement = function(ast, opciones={}) {
  if ('body' in ast) {
    let cuerpo = ast.body;
    if (Array.isArray(cuerpo)) {
      let primero;
      let anterior;
      for (let bloque of cuerpo) {
        let nuevo_bloque = Bloques.crearXmlBloque(bloque, {statement: true});
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

Bloques.mapaBloques.Identifier = function(ast, opciones={}) {
  let nombre;
  let hijos = [];
  if ('name' in ast) {
    nombre = ast.name;
  }
  if (nombre) {
    let campo_nombre = Bloques.domCampo('VAR', nombre);
    campo_nombre.setAttribute('id', Bloques.obtenerIdVariable(nombre));
    hijos.push(campo_nombre);
  }
  return Bloques.domBloque('variables_get', hijos);
};

Bloques.mapaDeOperadores = {
  '+': {izq:'A', der:'B', tipo:'math_arithmetic', op:'ADD'},
  '-': {izq:'A', der:'B', tipo:'math_arithmetic', op:'MINUS'},
  '*': {izq:'A', der:'B', tipo:'math_arithmetic', op:'MULTIPLY'},
  '/': {izq:'A', der:'B', tipo:'math_arithmetic', op:'DIVIDE'},
  '==': {izq:'A', der:'B', tipo:'logic_compare', op:'EQ'},
  '===': {izq:'A', der:'B', tipo:'logic_compare', op:'EQ'},
  '!=': {izq:'A', der:'B', tipo:'logic_compare', op:'NEQ'},
  '<': {izq:'A', der:'B', tipo:'logic_compare', op:'LT'},
  '>': {izq:'A', der:'B', tipo:'logic_compare', op:'GT'},
  '<=': {izq:'A', der:'B', tipo:'logic_compare', op:'LTE'},
  '>=': {izq:'A', der:'B', tipo:'logic_compare', op:'GTE'},
  '%': {izq:'DIVIDEND', der:'DIVISOR', tipo:'math_modulo'},
  '&&': {izq:'A', der:'B', tipo:'logic_operation', op:'AND'},
  '||': {izq:'A', der:'B', tipo:'logic_operation', op:'OR'}
};

Bloques.mapaBloques.BinaryExpression = function(ast, opciones={}) {
  if ('operator' in ast) {
    if (ast.operator in Bloques.mapaDeOperadores) {
      let mapa = Bloques.mapaDeOperadores[ast.operator];
      let opIzquierdo;
      let opDerecho;
      let hijos = [];
      if ('left' in ast) {
        opIzquierdo = ast.left;
      }
      if ('right' in ast) {
        opDerecho = ast.right;
      }
      if (mapa.op) {
        hijos.push(Bloques.domCampo('OP', mapa.op));
      }
      if (opIzquierdo) {
        let bloque_izquierdo = Bloques.crearXmlBloque(opIzquierdo, {expresion: true});
        if (bloque_izquierdo) {
          hijos.push(Bloques.domInput(mapa.izq, bloque_izquierdo));
        }
      }
      if (opDerecho) {
        let bloque_derecho = Bloques.crearXmlBloque(opDerecho, {expresion: true});
        if (bloque_derecho) {
          hijos.push(Bloques.domInput(mapa.der, bloque_derecho));
        }
      }
      return Bloques.domBloque(mapa.tipo, hijos);
    }
  }
  return null;
};

Bloques.mapaBloques.LogicalExpression = Bloques.mapaBloques.BinaryExpression;

Bloques.procesarInvocacionCompleja = function(tipo, callee, ast) {
  if (tipo == "MemberExpression") {
    if ('object' in callee && 'property' in callee && 'name' in callee.property) {
      let objeto = callee.object;
      let propiedad = callee.property.name;
      return Bloques.procesarSeleccionObjeto(objeto, propiedad, ast);
    }
  }
  return null;
};

Bloques.procesarSeleccionObjeto = function(objeto, propiedad, ast) {
  let tipo;
  let hijos = [];
  if (propiedad == 'push') {
    tipo = 'lists_setIndex';
    hijos.push(Bloques.domCampo('MODE', 'INSERT'));
    hijos.push(Bloques.domCampo('WHERE', 'LAST'));
    let bloque_lista = Bloques.crearXmlBloque(objeto, {expresion: true});
    if (bloque_lista) {
      hijos.push(Bloques.domInput('LIST', bloque_lista));
    }
    if ('arguments' in ast && ast.arguments.length == 1) {
      let bloque_elemento = Bloques.crearXmlBloque(ast.arguments[0], {expresion: true});
      if (bloque_elemento) {
        hijos.push(Bloques.domInput('TO', bloque_elemento));
      }
    }
  } else if (propiedad == 'join') {
    tipo = 'lists_split';
    hijos.push(Bloques.domMutador({mode: 'JOIN'}, []));
    hijos.push(Bloques.domCampo('MODE', 'JOIN'));
    let bloque_lista = Bloques.crearXmlBloque(objeto, {expresion: true});
    if (bloque_lista) {
      hijos.push(Bloques.domInput('INPUT', bloque_lista));
    }
    if ('arguments' in ast && ast.arguments.length == 1) {
      let bloque_elemento = Bloques.crearXmlBloque(ast.arguments[0], {expresion: true});
      if (bloque_elemento) {
        hijos.push(Bloques.domInput('DELIM', bloque_elemento));
      }
    }
  }
  if (tipo) {
    return Bloques.domBloque(tipo, hijos);
  }
  return null;
};

Bloques.obtenerContadorFor = function(ast) {
  if ('type' in ast && ast.type == 'VariableDeclaration') {
    if ('declarations' in ast && ast.declarations.length == 1) {
      if ('id' in ast.declarations[0]) {
        if ('name' in ast.declarations[0].id) {
          return ast.declarations[0].id.name;
        }
      }
    }
  } else if ('type' in ast && ast.type == 'AssignmentExpression') {
    if ('left' in ast) {
      if ('name' in ast.left) {
        if ('operator' in ast && ast.operator == '=') {
          return ast.left.name;
        }
      }
    }
   }
   return null;
};

Bloques.obtenerInicioFor = function(ast) {
  if ('type' in ast && ast.type == 'VariableDeclaration') {
    if ('declarations' in ast && ast.declarations.length == 1) {
      if ('init' in ast.declarations[0]) {
        return Bloques.crearXmlBloque(ast.declarations[0].init, {expresion: true});
      }
    }
  } else if ('type' in ast && ast.type == 'AssignmentExpression') {
    if ('right' in ast) {
      if ('operator' in ast && ast.operator == '=') {
        return Bloques.crearXmlBloque(ast.right, {expresion: true});
      }
    }
   }
   return null;
};

Bloques.obtenerLimiteFor = function(ast, i) {
  if ('type' in ast && ast.type == 'BinaryExpression') {
    if ('left' in ast && 'name' in ast.left && ast.left.name == i) {
      if ('right' in ast) {
        let bloque_limite = Bloques.crearXmlBloque(ast.right, {expresion: true});
        if ('operator' in ast) {
          if (ast.operator == '<=') {
            return bloque_limite;
          } else if (ast.operator == '<') {
            return bloque_resta = Bloques.domBloque('math_arithmetic', [
              Bloques.domCampo('OP', 'MINUS'),
              Bloques.domInput('A', bloque_limite),
              Bloques.domInput('B', Bloques.domBloque('math_number', [
                Bloques.domCampo('NUM', '1')
              ]))
            ]);
          }
        }
      }
    }
  }
  return null;
};

Bloques.obtenerPasoFor = function(ast, i) {
  if ('type' in ast && ast.type == 'UpdateExpression') {
    if ('argument' in ast && 'name' in ast.argument && ast.argument.name == i) {
      if ('operator' in ast) {
        if (ast.operator == '++') {
          return Bloques.domBloque('math_number', [
            Bloques.domCampo('NUM', '1'),
          ]);
        } else if (ast.operator == '--') {
          return Bloques.domBloque('math_number', [
            Bloques.domCampo('NUM', '-1'),
          ]);
        }
      }
    }
  }
  return null;
};

Bloques.alert = function(ast) {
  let argumento;
  let hijos = [];
  if ('arguments' in ast && ast.arguments.length == 1) {
    argumento = Bloques.crearXmlBloque(ast.arguments[0], {expresion: true});
  }
  if (argumento) {
    hijos.push(Bloques.domInput('TEXT', argumento));
  }
  return Bloques.domBloque('text_print', hijos);
};
