//procesos de la geolocalización

var Latitude = undefined;
var Longitude = undefined;
var selectedLocation = undefined;

// Get geo coordinates
function getMapLocation() {
  navigator.geolocation.getCurrentPosition(onMapSuccess, onMapError, { enableHighAccuracy: true });
}

// Success callback for get geo coordinates
var onMapSuccess = function (position) {
  Latitude = position.coords.latitude;
  Longitude = position.coords.longitude;
  getMap(Latitude, Longitude);
}

// Get map by using coordinates
function getMap(latitude, longitude) {
  var map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
      center: new Microsoft.Maps.Location(latitude, longitude),
      zoom: 15
  });

  var pushpin = new Microsoft.Maps.Pushpin(map.getCenter(), null);
  map.entities.push(pushpin);

  Microsoft.Maps.Events.addHandler(map, 'click', function (e) {
    if (e.targetType === "map") {
      var point = new Microsoft.Maps.Point(e.getX(), e.getY());
      var loc = e.target.tryPixelToLocation(point);
      selectedLocation = loc;
      var pushpin = new Microsoft.Maps.Pushpin(loc, null);
      map.entities.push(pushpin);
    }
  });
}

// Success callback for watching your changing position
var onMapWatchSuccess = function (position) {
  var updatedLatitude = position.coords.latitude;
  var updatedLongitude = position.coords.longitude;

  if (updatedLatitude != Latitude && updatedLongitude != Longitude) {
      Latitude = updatedLatitude;
      Longitude = updatedLongitude;
      getMap(updatedLatitude, updatedLongitude);
  }
}

// Error callback
function onMapError(error) {
  console.log('code: ' + error.code + '\n' +
      'message: ' + error.message + '\n');
}

// Watch your changing position
function watchMapPosition() {
  return navigator.geolocation.watchPosition(onMapWatchSuccess, onMapError, { enableHighAccuracy: true });
}


//funcion para agregar recordatorios
function saveReminder(selectedOption, selectedColor) {

  // Crea el nuevo recordatorio
  var newReminder = document.createElement('div');
  newReminder.className = 'color-box';
  newReminder.style.display = 'flex';
  newReminder.style.alignItems = 'center';
  newReminder.style.marginBottom = '20px';
  newReminder.style.marginTop = '20px';

  var colorBall = document.createElement('div');
  colorBall.className = 'color-ball';
  colorBall.style.width = '20px';
  colorBall.style.height = '20px';
  colorBall.style.borderRadius = '50%';
  colorBall.style.backgroundColor = selectedColor;
  colorBall.style.marginRight = '10px';
  newReminder.appendChild(colorBall);

  var text = document.createElement('div');
  text.className = 'text';
  text.style.flexGrow = '1';
  text.textContent = selectedOption;
  newReminder.appendChild(text);

  var icon = document.createElement('div');
  icon.className = 'icon';
  icon.innerHTML = '<ons-icon icon="fa-times"></ons-icon>';
  newReminder.appendChild(icon);

  // Agrega el nuevo recordatorio al HTML
  var remindersDiv = document.getElementById('recordatorios');
  remindersDiv.appendChild(newReminder);
}

//funciones de la base de datos
var global_database;
var isDatabaseOpen = false;
var isTableCreated = false;

document.addEventListener('pause', onPause, false);

function onPause() {
  console.log('App en pausa');
    if (isDatabaseOpen) {
        closeDatabase();
    }
}
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady(){
    console.log('Running Cordova'+ cordova.platformId + 'version' + cordova.version);
    global_database = window.sqlitePlugin.openDatabase(
        {
            name: 'my.db',
            location: 'default',
            androidDatabaseProvider: 'system',
            androidLockWorkaround:1
        },
        function(db){
            console.log('Base de datos abierta', db);
            isDatabaseOpen = true;
            createUsuarioTable();
            createTareasTable();
            createRecordatoriosTable();
        },
        function(error){
            console.log('Error al abrir la base de datos', error);
        }
    );
}
//cerrar database
function closeDatabase() {
  if (global_database) {
    global_database.close(function() {
      console.log("Database closed successfully");
      isDatabaseOpen = false;
    }, function(error) {
      console.log("Error closing database: " + error.message);
    });
  }
}
//Crear tablas
// Crear tabla usuario
function createUsuarioTable() {
  global_database.transaction(function(tx){
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS usuario (
        id_u INTEGER PRIMARY KEY, 
        nombre_u TEXT NOT NULL, 
        apellido_u TEXT NOT NULL,
        fecha_nac_u DATE NOT NULL,
        correo_u TEXT NOT NULL UNIQUE,
        contrasena_u TEXT NOT NULL,
        foto_u TEXT
      )`, [],
      function(tx, result){
        console.log('Tabla usuario creada', result);
      },
      function(tx, error){
        console.log('Error al crear la tabla usuario', error);
      }
    );
  });
}

// Crear la tabla de tareas
function createTareasTable() {
  global_database.transaction(function(tx){
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS tareas (
        id_t INTEGER PRIMARY KEY, 
        titulo_t TEXT NOT NULL UNIQUE, 
        hora_inicio_t TIME,
        hora_fin_t TIME,
        fecha_t DATE NOT NULL,
        latitud_t REAL,
        longitud_t REAL,
        descripcion_t TEXT,
        repeticion_t TEXT NOT NULL,
        importancia_t TEXT NOT NULL,
        notas_t TEXT
      )`, [],
      function(tx, result){
        console.log('Tabla tareas creada', result);
      },
      function(tx, error){
        console.log('Error al crear la tabla tareas', error);
      }
    );
  });
}

// Crear la tabla de recordatorios
function createRecordatoriosTable() {
  global_database.transaction(function(tx){
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS recordatorios (
        id_re INTEGER PRIMARY KEY, 
        tarea_id_re INTEGER, 
        color_re TEXT NOT NULL,
        hora_re TIME NOT NULL,
        recordatorio TEXT,
        FOREIGN KEY(tarea_id_re) REFERENCES tareas(id_t)
      )`, [],
      function(tx, result){
        console.log('Tabla recordatorios creada', result);
      },
      function(tx, error){
        console.log('Error al crear la tabla recordatorios', error);
      }
    );
  });
}

//crear usuario
function createUser(nombre, apellido, fecha_nac, correo, contrasena, foto) {
  global_database.transaction(function(tx){
      tx.executeSql('SELECT COUNT(*) AS count FROM usuario WHERE correo_u = ?', [correo], function(tx, res) {
          if (res.rows.item(0).count === 0) {
              // El usuario no existe, inserta los datos
              tx.executeSql('INSERT INTO USUARIO (nombre_u, apellido_u, fecha_nac_u, correo_u, contrasena_u, foto_u) VALUES (?, ?, ?, ?, ?, ?)', [nombre, apellido, fecha_nac, correo, contrasena, foto], 
              function(tx, result){
                  console.log('Datos insertados:', result);
              },
              function(tx, error) {
                  console.error('Error al insertar datos:', error);
              });
          } else {
              // El usuario ya existe, no insertes nada
              console.log('El usuario ya existe');
          }
      }, function(tx, error){
          console.log('Error al realizar el registro', error);
      });
  });
}
//buscar usuario
function getUserByEmail(correo) {
  return new Promise((resolve, reject) => {
    global_database.transaction(function(tx){
      tx.executeSql('SELECT * FROM usuario WHERE correo_u = ?', [correo], function(tx, res){
        var row = res.rows.item(0);
        console.log('Usuario encontrado:', row);
        resolve(row);
      }, function(tx, error){
        console.log('Error al buscar el usuario', error);
        reject(error);
      });
    });
  });
}
//agregar datos
//crear tarea
function createTask(titulo, hora_inicio, hora_fin, fecha, latitud, longitud, descripcion, repeticion, importancia, notas) {
  global_database.transaction(function(tx){
      tx.executeSql('SELECT COUNT(*) AS count FROM tareas WHERE titulo_t = ?', [titulo], function(tx, res) {
          if (res.rows.item(0).count === 0) {
              // La tarea no existe, inserta los datos
              tx.executeSql('INSERT INTO tareas (titulo_t, hora_inicio_t, hora_fin_t, fecha_t, latitud_t, longitud_t, descripcion_t, repeticion_t, importancia_t, notas_t) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [titulo, hora_inicio, hora_fin, fecha, latitud, longitud, descripcion, repeticion, importancia, notas], 
              function(tx, result){
                  console.log('Datos insertados:', result);
              },
              function(tx, error) {
                  console.error('Error al insertar datos:', error);
              });
          } else {
              // La tarea ya existe, no insertes nada
              console.log('La tarea ya existe');
          }
      }, function(tx, error){
          console.log('Error al realizar el registro', error);
      });
  });
}
//eliminar tarea
function deleteTask(titulo) {
  global_database.transaction(function(tx){
      tx.executeSql('DELETE FROM tareas WHERE titulo_t = ?', [titulo], function(tx, res){
          console.log('Tarea eliminada');
      }, function(tx, error){
          console.log('Error al eliminar la tarea', error);
      });
  });
}
// Función para mostrar las tareas en la página page1.html
function formatDate(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}

function showTasks() {
  var fecha = new Date();
  var formattedDate = formatDate(fecha);

  global_database.transaction(function(tx){
      tx.executeSql('SELECT * FROM tareas WHERE fecha_t = ?', [formattedDate], function(tx, res){
          var listaTareas = document.getElementById('listaTareas');
          for (var i = 0; i < res.rows.length; i++) {
              var row = res.rows.item(i);
              var listItem = document.createElement('ons-list-item');
              var tituloA=row.titulo_t;
              listItem.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <div style="background-color: #f0f0f0; padding: 8px; border-radius: 10px; margin-right: 8px; flex: 1;">
                        <p>${row.hora_inicio_t} - ${row.hora_fin_t}</p>
                    </div>
                    <div style="background-color: #f0f0f0; padding: 8px; border-radius: 10px; margin-left: 8px; flex: 3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" onclick="MostrarInfo('${tituloA}')" >
                        <p>${row.titulo_t}</p>
                    </div>
                </div>
              `;
              listaTareas.appendChild(listItem);
          }
      }, function(tx, error){
          console.log('Error al mostrar las tareas', error);
      });
  });
}

function showWeekTasks() {
  let weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  let today = new Date();
  let currentDayOfWeek = today.getDay();
  let startDate = new Date(today.setDate(today.getDate() - currentDayOfWeek + 1)); // Monday of the current week

  global_database.transaction(function(tx) {
    for(let index = 0; index < weekDays.length; index++) {
      let currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);
      let formattedDate = `${currentDate.getFullYear()}-${('0' + (currentDate.getMonth() + 1)).slice(-2)}-${('0' + currentDate.getDate()).slice(-2)}`; // Format date as YYYY-MM-DD

      // Set the date in the title
      let tituloDia = document.querySelector(`#t-${weekDays[index]}`);
      let formattedTitleDate = `${weekDays[index]} ${currentDate.getDate()} de ${monthNames[currentDate.getMonth()]} del ${currentDate.getFullYear()}`;
      tituloDia.textContent = formattedTitleDate;

      let sql = `SELECT * FROM tareas WHERE fecha_t = '${formattedDate}'`;
      tx.executeSql(sql, [], function(tx, resultSet) {
        let tasksForDay = [];
        for(let x = 0; x < resultSet.rows.length; x++) {
          tasksForDay.push(resultSet.rows.item(x));
        }

        // Agrupar las tareas por día
        let listaTareas = document.querySelector(`#list-${weekDays[index]}`);
        tasksForDay.forEach(tarea => {
          let listItem = document.createElement('ons-list-item');
          var tituloC=tarea.titulo_t;
          listItem.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
              <div style="background-color: #f0f0f0; padding: 8px; border-radius: 10px; margin-right: 8px; flex: 1;">
                <p>${tarea.hora_inicio_t} - ${tarea.hora_fin_t}</p>
              </div>
              <div style="background-color: #f0f0f0; padding: 8px; border-radius: 10px; margin-left: 8px; flex: 3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"  onclick="MostrarInfo('${tituloC}')" >
                <p>${tarea.titulo_t}</p>
              </div>
            </div>
          `;
          listaTareas.appendChild(listItem);
        });
      }, function(tx, error) {
        console.log('SELECT error: ' + error.message);
      });
    }
  });
}

//mostrar info de la tarea
function MostrarInfo(tituloB){
  // Consulta la tarea por el título
  getTaskByTitle(tituloB)
    .then(row => {
      console.log('Tarea encontrada:', row);
      // Muestra la información en el diálogo
      document.getElementById('info-task-tile').textContent = row.titulo_t;
      document.getElementById('info-task-time1').textContent = row.hora_inicio_t + ' - ' + row.hora_fin_t;
      document.getElementById('info-task-date').textContent = row.fecha_t;
      document.getElementById('info-task-description').textContent = row.descripcion_t;
      document.getElementById('info-task-frecuency').textContent = row.repeticion_t;
      document.getElementById('info-task-priority').textContent = row.importancia_t;
      document.getElementById('info-task-notes').textContent = row.notas_t;

      // Muestra el diálogo
      document.getElementById('dialog-show-info-task').show();
    })
    .catch(error => {
      console.log('Error al buscar la tarea', error);
    });
}


function comfirmarDelete() {
  var tituloB = document.getElementById('info-task-tile').textContent;
  deleteTask(tituloB);
  document.querySelector('#dialog-delete-task').hide();
  alert('Tarea eliminada');
}
function irAEditar() {
  var tituloB = document.getElementById('info-task-tile').textContent;
  document.querySelector('#myNavigator').pushPage('html/edit-task.html', {data: {titulo: tituloB}});
}
// Función para consultar una tarea por el título
function getTaskByTitle(titulo) {
  return new Promise((resolve, reject) => {
    global_database.transaction(function(tx){
      tx.executeSql('SELECT * FROM tareas WHERE titulo_t = ?', [titulo], function(tx, res){
        var row = res.rows.item(0);
        console.log('Tarea encontrada:', row);
        resolve(row);
      }, function(tx, error){
        console.log('Error al buscar la tarea', error);
        reject(error);
      });
    });
  });
}

document.addEventListener('init', function(event) {
  if (event.target.id === 'init-session') {
    if (event.target.querySelector('#login-button')) {

      event.target.querySelector('#login-button').onclick = function() {
        document.querySelector('#myNavigator').resetToPage('html/init-first.html');
      };  
    }
    if (event.target.querySelector('#create-account-button')) {

      event.target.querySelector('#create-account-button').onclick = function() {
        document.querySelector('#myNavigator').resetToPage ('html/registro_1.html');
      };  
    }
  }
  //registro-paso1= Vista de agregar datos personales
  if (event.target.id === 'registro-paso1') {
    if (event.target.querySelector('#reg1')) {
      event.target.querySelector('#reg1').onclick = function() {
        //vvariables del usuario capturadas en esta hoja
        var Name_r=document.getElementById('nombre_r').value;
        var LastName_r=document.getElementById('apellido_r').value;
        var Birth_r=document.getElementById('fecha-nacimiento_r').value;
        document.querySelector('#myNavigator').pushPage ('html/registro_2.html',{data: {nombre:Name_r,apellido:LastName_r,fecha_nac:Birth_r}});
        console.log('Nombre: ' + Name_r, 'Apellido: ' + LastName_r, 'Fecha de nacimiento: ' + Birth_r);
      };
    }
    if (event.target.querySelector('#descartar1')) {
      event.target.querySelector('#descartar1').onclick = function() {
        document.querySelector('#confirmacion-dialog-r1').show();
      };
    }
    // Verifica si existe un botón con el ID 'confirmar-button' en la página
    if (event.target.querySelector('#confirmar-button-r1')) {
      // Asigna una función al evento de clic del botón 'confirmar-button'
      event.target.querySelector('#confirmar-button-r1').onclick = function() {
          // Oculta el diálogo de confirmación
          document.getElementById('confirmacion-dialog-r1').hide();
      };
    }
  }
  //registro-paso2= Vista de agregar datos usuario
  if (event.target.id === 'registro-paso2') {
    if (event.target.querySelector('#reg2')) {
      event.target.querySelector('#reg2').onclick = function() {
        //variables de la pagina anterior
        var Name_r=event.target.data.nombre;
        var LastName_r=event.target.data.apellido;
        var Birth_r=event.target.data.fecha_nac;
        //vvariables del usuario capturadas en esta hoja
        var Email_r=document.getElementById('correo_r').value;
        var Password_r=document.getElementById('contrasena_r').value;
        var Confirm_r=document.getElementById('confirmar-contrasena_r').value;
        document.querySelector('#myNavigator').pushPage ('html/registro_3.html',{data: {nombre:Name_r, apellido:LastName_r,fecha_nac:Birth_r,correo:Email_r,contrasena:Password_r,confirmar:Confirm_r}});
        console.log('Nombre: ' + Name_r, 'Apellido: ' + LastName_r, 'Fecha de nacimiento: ' + Birth_r, 'Correo: ' + Email_r, 'Contraseña: ' + Password_r, 'Confirmar contraseña: ' + Confirm_r);
      };
    }
    if (event.target.querySelector('#descartar2')) {
      event.target.querySelector('#descartar2').onclick = function() {
        document.querySelector('#confirmacion-dialog-r2').show();
      };
    }
    // Verifica si existe un botón con el ID 'confirmar-button' en la página
    if (event.target.querySelector('#confirmar-button-r2')) {
      // Asigna una función al evento de clic del botón 'confirmar-button'
      event.target.querySelector('#confirmar-button-r2').onclick = function() {
          // Oculta el diálogo de confirmación
          document.getElementById('confirmacion-dialog-r2').hide();
      };
    }
  }
  //registro-paso3= Vista de agregar foto
  if (event.target.id === 'registro-paso3') {
    if(event.target.querySelector('#guardar_final')){
      event.target.querySelector('#guardar_final').onclick = function() {
        //variables de la pagina anterior
        var Name_r=event.target.data.nombre;
        var LastName_r=event.target.data.apellido;
        var Birth_r=event.target.data.fecha_nac;
        var Email_r=event.target.data.correo;
        var Password_r=event.target.data.contrasena;
        var Confirm_r=event.target.data.confirmar;
        //vvariables del usuario capturadas en esta hoja
        var Foto_r=document.getElementById('foto-perfil').value;
        document.querySelector('#myNavigator').pushPage ('html/init-first.html');
        console.log('Nombre: ' + Name_r, 'Apellido: ' + LastName_r, 'Fecha de nacimiento: ' + Birth_r, 'Correo: ' + Email_r, 'Contraseña: ' + Password_r, 'Confirmar contraseña: ' + Confirm_r, 'Foto: ' + Foto_r);
        // Guardar el usuario
        createUser(Name_r, LastName_r, Birth_r, Email_r, Password_r, Foto_r);
        document.querySelector('#guardando-dialog-reg').hide();
      };
    }
    if(event.target.querySelector('#reg-final')){
      event.target.querySelector('#reg-final').onclick = function() {
        //vvariables del usuario capturadas en esta hoja
        var Foto_r=document.getElementById('foto-perfil').value;
        document.querySelector('#guardando-dialog-reg').show();
      };
    }
    if (event.target.querySelector('#descartar3')) {
      event.target.querySelector('#descartar3').onclick = function() {
        document.querySelector('#confirmacion-dialog-r3').show();
      };
    }
    // Verifica si existe un botón con el ID 'confirmar-button' en la página
    if (event.target.querySelector('#confirmar-button-r3')) {
      // Asigna una función al evento de clic del botón 'confirmar-button'
      event.target.querySelector('#confirmar-button-r3').onclick = function() {
          // Oculta el diálogo de confirmación
          document.getElementById('confirmacion-dialog-r3').hide();
      };
    }
  }
  //init-first= Vista de inicio general
  if (event.target.id === 'init-1') {
    if (event.target.querySelector('#add-button')) {
        event.target.querySelector('#add-button').onclick = function() {
            document.querySelector('#myNavigator').pushPage('html/page2.html');
        };
    }
  }
  //Tab3= Vista del mes 
  if (event.target.id === 'tab3') {
    // Calcular el primer día del mes actual
    var today = new Date();
    var firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    var startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

    // Calcular el número de días en el mes actual
    var numberOfDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // Llenar la tabla con los días del mes
    var week = 1;
    var dayCounter = 1;
    for (var i = 0; i < 6; i++) { // 6 semanas máximas en un mes
        var row = document.getElementById('week' + week);
        var rowContent = '';

        for (var j = 0; j < 7; j++) { // 7 días en una semana
            if (i === 0 && j < startingDayOfWeek) {
                rowContent += '<td style="width: 40px; height: 70px;"></td>'; // Celdas vacías antes del primer día del mes
            } else if (dayCounter > numberOfDaysInMonth) {
                rowContent += '<td style="width: 40px; height: 70px;"></td>'; // Celdas vacías después del último día del mes
            } else {
                if (dayCounter === today.getDate()) {
                    rowContent += '<td style="border: 2px solid #FF4848; width: 40px; height: 70px;">' + dayCounter + '</td>'; // Día actual
                } else {
                    rowContent += '<td style="width: 40px; height: 70px;">' + dayCounter + '</td>'; // Día del mes actual
                }
                dayCounter++;
            }
        }

        row.innerHTML = rowContent;
        week++;
    }
  }
  // page2= Vista de la tarea a crear
  if (event.target.id === 'page2') {
    var importanciaSelect='';

    //esta linea es para cambiar el titulo de la pagina
    event.target.querySelector('ons-toolbar .center').innerHTML = event.target.data.title;

    // Verifica si existe un botón con el ID 'add-location' en la página
    if (event.target.querySelector('#add-location')) {
        // Asigna una función al evento de clic del botón 'add-location'
        event.target.querySelector('#add-location').onclick = function() {
            // Muestra la página 'location.html' en el navigator
            document.querySelector('#myNavigator').pushPage('html/location.html');
        };
    }
    // Verifica si existe un botón con el ID 'volver-button' en la página
    if (event.target.querySelector('#volver-button')) {
        // Asigna una función al evento de clic del botón 'volver-button'
        event.target.querySelector('#volver-button').onclick = function() {
            // Muestra el diálogo de confirmación
            document.getElementById('confirmacion-dialog').show();
        };
    }
    // Verifica si existe un botón con el ID 'confirmar-button' en la página
    if (event.target.querySelector('#confirmar-button')) {
        // Asigna una función al evento de clic del botón 'confirmar-button'
        event.target.querySelector('#confirmar-button').onclick = function() {
            // Oculta el diálogo de confirmación
            document.getElementById('confirmacion-dialog').hide();
        };
    }
    if(event.target.querySelector('#add-hour')){
      document.getElementById('add-hour').onclick = function() {
        document.getElementById('date-time-dialog').show();
        fechayhoraSelect=document.getElementById('add-hour').value;
      };
    }
    if(event.target.querySelector('#add-record')){
      document.getElementById('add-record').onclick = function() {
        document.getElementById('reminder-dialog').show();
      };
    }
    if(event.target.querySelector('#close-reminder-dialog')){
      document.getElementById('close-reminder-dialog').onclick = function() {
        // Obtén las opciones seleccionadas
        var selectElement = document.getElementById('reminder-options');
        var selectedOption = selectElement.options[selectElement.selectedIndex].text;
        var selectedColorRadio = document.querySelector('input[name="color"]:checked');
        if (selectedColorRadio) {
          var selectedColor = selectedColorRadio.value;
          console.log('Color seleccionado: ' + selectedColor);
          // Guarda el recordatorio
          saveReminder(selectedOption, selectedColor);
        } else {
          alert('No se seleccionó ningún color');
        }
        document.getElementById('reminder-dialog').hide();
      };
    }

    if(event.target.querySelector('#i-normal')){
      //cambio de color el fondo del div
      document.getElementById('i-normal').onclick = function() {
        // Restablecer el color de fondo y la importancia de todos los divs
        document.getElementById('i-normal').style.backgroundColor = '';
        document.getElementById('i-importante').style.backgroundColor = '';
        importanciaSelect = null;
    
        // Establecer el color de fondo y la importancia del div seleccionado
        document.getElementById('i-normal').style.backgroundColor = '#FF4848';
        importanciaSelect='Normal';
        console.log(importanciaSelect);
      };
    }
    if(event.target.querySelector('#i-importante')){
      //cambio de color el fondo del div
      document.getElementById('i-importante').onclick = function() {
        // Restablecer el color de fondo y la importancia de todos los divs
        document.getElementById('i-normal').style.backgroundColor = '';
        document.getElementById('i-importante').style.backgroundColor = '';
        importanciaSelect = null;
    
        // Establecer el color de fondo y la importancia del div seleccionado
        document.getElementById('i-importante').style.backgroundColor = '#FF4848';
        importanciaSelect='Importante';
        console.log(importanciaSelect);
      };
    }
    // Verifica si existe un botón con el ID 'guardar-button' en la página
    if (event.target.querySelector('#guardar-button')) {
      // Asigna una función al evento de clic del botón 'guardar-button'
      event.target.querySelector('#guardar-button').onclick = function() {
        //saco los elementos de la tarea a guardar
        var titulo_t=document.getElementById('titulo').value;
        var descripcion_t=document.getElementById('descripcion').value;
        var notas_t=document.getElementById('notas').value;
        var locationSelect = selectedLocation;
        var repeticion_t = document.getElementById('repeticion').value;
        var fecha = document.getElementById('date-input').value;
        var hora = document.getElementById('time-input').value;
        var hora_fin= document.getElementById('hora-fin').value;
        
        console.log('Titulo: ' + titulo_t);
        console.log('Fecha: ' + fecha);
        console.log('Hora: ' + hora);
        console.log('Hora fin: ' + hora_fin);
        console.log('Localizacion: ' + locationSelect);
        console.log('Descripcion: ' + descripcion_t);
        console.log('Repeticion: ' + repeticion_t);
        console.log('Importancia: ' + importanciaSelect);
        console.log('Notas: ' + notas_t);
        // Guardar la tarea
        createTask(titulo_t, hora, hora_fin, fecha, locationSelect, descripcion_t, repeticion_t, importanciaSelect, notas_t);
        // Muestra el diálogo de guardado
        document.getElementById('guardando-dialog').show();
        // Simula un tiempo de guardado y luego oculta el diálogo
        setTimeout(function() {
            document.getElementById('guardando-dialog').hide();
            // Aquí puedes agregar la lógica para guardar la tarea después de simular un tiempo de guardado
        }, 500);
      };
    }
  }

  if (event.target.matches('#mapPage')) {
    getMapLocation();
  }
});



window.fn = {};

window.fn.open = function() { 
  var menu = document.getElementById('menu-options'); 
  menu.open(); 
};

window.fn.load = function(page) { 
  var content = document.getElementById('content'); 
  var menu = document.getElementById('menu-options'); 
  content.load(page)
    .then(menu.close.bind(menu))
    .catch(function(error) {
      console.error('Error loading page:', error);
    });
};