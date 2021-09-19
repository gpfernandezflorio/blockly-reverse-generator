Bloques.mapaBloques = {};

Bloques.mapaBloques.VariableDeclaration = function(ast, opciones={}) {
  if (ast.declarations) {
    let primero;
    let anterior;
    for (let declaracion of ast.declarations) {
      let nombre;
      let valor;
      let hijos = [];
      if (declaracion.id) {
        if (declaracion.id.name) {
          nombre = declaracion.id.name;
        }
      }
      if (declaracion.init) {
        if (declaracion.init.type && declaracion.init.type == 'FunctionExpression') {
          // Entonces es una función.
          Bloques.procesarFuncionDeclaracion(nombre, declaracion.init);
        } else {
          valor = Bloques.crearXmlBloque(declaracion.init, {expresion: true});
        }
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
  if (ast.elements) {
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
  if (ast.raw != null) {
    if (['true','false'].includes(ast.raw)) {
      tipo = 'logic_boolean';
      Bloques.establecerCampo(campo_valor, 'BOOL', ast.raw.toUpperCase());
    } else if (Bloques.esUnString(ast.raw)) {
      tipo = 'text';
      if (ast.value != null) {
        Bloques.establecerCampo(campo_valor, 'TEXT', ast.value);
      } else {
        alert("No sé qué texto asignar");
      }
    }
  }
  if (tipo == 'math_number') {
    if (ast.value != null) {
      Bloques.establecerCampo(campo_valor, 'NUM', ast.value);
    } else {
      alert("No sé qué número asignar");
    }
  }
  return Bloques.domBloque(tipo, [campo_valor]);
};

Bloques.mapaBloques.FunctionDeclaration = function(ast, opciones={}) {
  return Bloques.procesarFuncion(ast, opciones);
};

Bloques.mapaBloques.ExpressionStatement = function(ast, opciones={}) {
  if (ast.expression) {
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
  if (ast.callee) {
    let callee = ast.callee;
    if (callee.type && callee.type !== 'Identifier') {
      // Entonces no es un llamado a una función
      return Bloques.procesarInvocacionCompleja(callee.type, callee, ast);
    }
    if (callee.name) {
      nombre = callee.name;
      if (nombre == 'alert') {
        return Bloques.alert(ast);
      }
    }
  }
  if (ast.arguments) {
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
  if (opciones.expresion) {
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
  if (ast.left) {
    if (ast.left.name) {
      nombre = ast.left.name;
    }
  }
  if (ast.right) {
    if (ast.right.type && ast.right.type == 'FunctionExpression') {
      // Entonces es una función.
      Bloques.procesarFuncionDeclaracion(nombre, ast.right);
    } else {
      valor = Bloques.crearXmlBloque(ast.right, {expresion: true});
    }
  }
  if (nombre) {
    let campo_nombre = Bloques.domCampo('VAR', nombre);
    campo_nombre.setAttribute('id', Bloques.obtenerIdVariable(nombre));
    hijos.push(campo_nombre);
  }
  if (valor) {
    hijos.push(Bloques.domInput('VALUE', valor));
    if (ast.operator) {
      if (ast.operator == '=') {
        return Bloques.domBloque('variables_set', hijos);
      }
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
  if (ast.body) {
    cuerpo = Bloques.crearXmlBloque(ast.body, {statement: true});
  }
  if (ast.init) {
    contador = Bloques.obtenerContadorFor(ast.init);
    desde = Bloques.obtenerInicioFor(ast.init);
  }
  if (contador != null && ast.test != null) {
    hasta = Bloques.obtenerLimiteFor(ast.test, contador);
  }
  if (contador != null && ast.update != null) {
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
  if (ast.body) {
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
  return null;
};

Bloques.mapaBloques.Identifier = function(ast, opciones={}) {
  let nombre;
  let hijos = [];
  if (ast.name) {
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
  if (ast.operator) {
    if (ast.operator in Bloques.mapaDeOperadores) {
      let mapa = Bloques.mapaDeOperadores[ast.operator];
      let opIzquierdo;
      let opDerecho;
      let hijos = [];
      if (ast.left) {
        opIzquierdo = ast.left;
      }
      if (ast.right) {
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
    if (callee.object != null && callee.property != null && callee.property.name != null) {
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
    if (ast.arguments != null && ast.arguments.length == 1) {
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
    if (ast.arguments != null && ast.arguments.length == 1) {
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
  if (ast.type != null && ast.type == 'VariableDeclaration') {
    if (ast.declarations != null && ast.declarations.length == 1) {
      if (ast.declarations[0].id) {
        if (ast.declarations[0].id.name) {
          return ast.declarations[0].id.name;
        }
      }
    }
  } else if (ast.type != null && ast.type == 'AssignmentExpression') {
    if (ast.left) {
      if (ast.left.name) {
        if (ast.operator != null && ast.operator == '=') {
          return ast.left.name;
        }
      }
    }
   }
   return null;
};

Bloques.obtenerInicioFor = function(ast) {
  if (ast.type != null && ast.type == 'VariableDeclaration') {
    if (ast.declarations != null && ast.declarations.length == 1) {
      if (ast.declarations[0].init) {
        return Bloques.crearXmlBloque(ast.declarations[0].init, {expresion: true});
      }
    }
  } else if (ast.type != null && ast.type == 'AssignmentExpression') {
    if (ast.right) {
      if (ast.operator != null && ast.operator == '=') {
        return Bloques.crearXmlBloque(ast.right, {expresion: true});
      }
    }
   }
   return null;
};

Bloques.obtenerLimiteFor = function(ast, i) {
  if (ast.type != null && ast.type == 'BinaryExpression') {
    if (ast.left != null && ast.left.name != null && ast.left.name == i) {
      if (ast.right) {
        let bloque_limite = Bloques.crearXmlBloque(ast.right, {expresion: true});
        if (ast.operator) {
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
  if (ast.type != null && ast.type == 'UpdateExpression') {
    if (ast.argument != null && ast.argument.name != null && ast.argument.name == i) {
      if (ast.operator) {
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
  if (ast.arguments != null && ast.arguments.length == 1) {
    argumento = Bloques.crearXmlBloque(ast.arguments[0], {expresion: true});
  }
  if (argumento) {
    hijos.push(Bloques.domInput('TEXT', argumento));
  }
  return Bloques.domBloque('text_print', hijos);
};

Bloques.procesarFuncionDeclaracion = function(nombre, ast, opciones={}) {
  ast.id = {name: nombre};
  let definicion = Bloques.procesarFuncion(ast, opciones);
  // La agrego al final porque puedo estar en medio de un bloque
  Bloques.hacerAlFinal(function() {
    Main.bloqueAdicional(definicion);
  });
};

Bloques.procesarFuncion = function(ast, opciones={}) {
  let tipo = 'procedures_defnoreturn';
  let nombre;
  let cuerpo;
  let hijos = [];
  let parametros = [];
  if (ast.id) {
    if (ast.id.name) {
      nombre = ast.id.name;
    }
  }
  if (ast.params) {
    for (let parametro of ast.params) {
      if (parametro.name) {
        Bloques.registrarParametro(nombre, parametro.name);
        parametros.push(Bloques.domGenerico('arg', parametro.name));
      }
    }
  }
  if (ast.body) {
    if (Bloques.esFuncion(ast.body)) {
      let lista_comandos = ast.body.body;
      if (Bloques.esFuncionSimple(lista_comandos)) {
        let cuerpo_interno = {type: 'BlockStatement', body: lista_comandos.slice(0,-1)};
        cuerpo = Bloques.crearXmlBloque(cuerpo_interno, {statement: true});
        let ultimo = lista_comandos[lista_comandos.length-1];
        if (ultimo != null && ultimo.type != null && ultimo.type == 'ReturnStatement' && ultimo.argument != null) {
          let bloque_return = Bloques.crearXmlBloque(ultimo.argument, {expresion: true});
          if (bloque_return) {
            hijos.push(Bloques.domInput('RETURN', bloque_return));
          }
        }
      } else {

      }
    } else {
      cuerpo = Bloques.crearXmlBloque(ast.body, {statement: true});
    }
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
