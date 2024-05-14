/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('init', function(event) {
  var page = event.target;

  // Manejar la lógica específica de la inicialización de las páginas aquí
  if (page.id === 'homePage') {
    // Código para la página de inicio
  } else if (page.id === 'anotherPage') {
    // Código para otra página
  }
});

// Función para cambiar de página
function pushPage(page) {
  document.querySelector('#myNavigator').pushPage(page);
}

// Función para manejar el enrutamiento basado en hashes
window.addEventListener('hashchange', function() {
  var page = location.hash.slice(1) + '.html';
  pushPage(page);
});
