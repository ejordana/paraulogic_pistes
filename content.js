// Script que s'executa a la pàgina del Paraulògic
(function() {
  'use strict';

  console.log('🎮 Extensió Paraulògic - Pistes Dinàmiques carregada!');

  let pistesOriginals = null;
  let pistesActuals = null;
  let paraulesDescobertes = [];
  let lletresCentrals = [];
  let solucions = [];
  let paraulaActual = '';
  let validacioActiva = true;
  let ultimaParaulaValidada = '';

  // Crear el panell de pistes flotant
  function crearPanellPistes() {
    const panell = document.createElement('div');
    panell.id = 'pistes-dinamiques-panel';
    panell.innerHTML = `
      <div id="pistes-header">
        <h3>📊 Pistes Dinàmiques</h3>
        <button id="pistes-toggle">−</button>
        <button id="pistes-refresh">🔄</button>
        <button id="pistes-validacio-toggle" title="Activar/desactivar validació de paraules">✓</button>
      </div>
      <div id="pistes-content">
        <div class="pistes-loading">Carregant pistes...</div>
      </div>
    `;
    document.body.appendChild(panell);

    // Funcionalitat del botó toggle
    document.getElementById('pistes-toggle').addEventListener('click', function() {
      const content = document.getElementById('pistes-content');
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      this.textContent = isHidden ? '−' : '+';
    });

    // Funcionalitat del botó refresh
    document.getElementById('pistes-refresh').addEventListener('click', function() {
      actualitzarPanellPistes();
    });

    // Funcionalitat del botó de validació
    const btnValidacio = document.getElementById('pistes-validacio-toggle');
    btnValidacio.addEventListener('click', function() {
      validacioActiva = !validacioActiva;
      this.style.opacity = validacioActiva ? '1' : '0.3';
      this.style.textDecoration = validacioActiva ? 'none' : 'line-through';
      console.log(`🔔 Validació de paraules ${validacioActiva ? 'activada' : 'desactivada'}`);

      // Guardar preferència
      try {
        localStorage.setItem('paraulogic-validacio-activa', validacioActiva.toString());
      } catch (e) {}
    });

    // Restaurar preferència guardada
    try {
      const preferencia = localStorage.getItem('paraulogic-validacio-activa');
      if (preferencia !== null) {
        validacioActiva = preferencia === 'true';
        btnValidacio.style.opacity = validacioActiva ? '1' : '0.3';
        btnValidacio.style.textDecoration = validacioActiva ? 'none' : 'line-through';
      }
    } catch (e) {}

    // Fer el panell arrossegable
    ferArrossegable(panell);
  }

  // Fer el panell arrossegable
  function ferArrossegable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('#pistes-header');
    
    header.onmousedown = iniciarArrossegar;

    function iniciarArrossegar(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = deixarArrossegar;
      document.onmousemove = arrossegar;
    }

    function arrossegar(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function deixarArrossegar() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Extreure les pistes de la pàgina
  function extreurePistes() {
    console.log('🔍 Intentant extreure pistes amb REGEX PUR...');
    
    try {
      // Primer: determinar quin és el joc actual
      const gameNumber = document.body.getAttribute('data-joc');
      console.log('🎮 Número de joc actual:', gameNumber);
      
      const scripts = document.getElementsByTagName('script');
      console.log(`📄 Trobats ${scripts.length} scripts a la pàgina`);
      
      // Buscar el script que té les variables y i t (jocs anteriors i actual)
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const content = script.textContent;
        
        // Aquest script conté TOTS els jocs (var y={...}; var t={...}; var game_number=...)
        if (content.includes('var game_number=') && content.includes('var t=')) {
          console.log(`✓ Script amb jocs trobat! (script ${i})`);
          
          // Extreure el game_number per saber quina variable usar
          const gameNumMatch = content.match(/var game_number\s*=\s*(\d+)/);
          if (gameNumMatch) {
            const scriptGameNum = gameNumMatch[1];
            console.log('📊 Game number al script:', scriptGameNum);
            console.log('📊 Game number al body:', gameNumber);
            
            // Determinar si hem d'usar 't' o 'y'
            // Normalment 't' és el joc actual i 'y' l'anterior
            let varName = 't';
            
            // Buscar var t={...};
            const varPattern = new RegExp(`var ${varName}\\s*=\\s*(\\{[\\s\\S]*?\\});`, 'm');
            const varMatch = content.match(varPattern);
            
            if (varMatch) {
              const objectContent = varMatch[1];
              console.log(`✓ Variable "${varName}" trobada!`);
              
              // Extreure lletres d'aquest objecte específic
              const lletresMatch = objectContent.match(/"l"\s*:\s*\[([^\]]+)\]/);
              if (lletresMatch) {
                const lletresArray = lletresMatch[1].match(/"([^"]+)"/g);
                if (lletresArray) {
                  lletresCentrals = lletresArray.map(l => l.replace(/"/g, ''));
                  console.log('✓ Lletres extretes:', lletresCentrals);
                }
              }
              
              // Extreure pistes d'aquest objecte específic
              const pistesMatch = objectContent.match(/"pistes"\s*:\s*"(\{[^"]*\})(?:\\n)?"/);
              
              if (pistesMatch) {
                console.log('✓ Pistes trobades amb regex!');
                
                let pistesStr = pistesMatch[1];
                console.log('📊 String original:', pistesStr.substring(0, 150) + '...');
                
                // Netejar el string
                pistesStr = pistesStr.replace(/'/g, '"');
                pistesStr = pistesStr.replace(/\\"/g, '"');
                pistesStr = pistesStr.trim();
                
                console.log('📊 String netejat:', pistesStr.substring(0, 150) + '...');
                
                try {
                  pistesOriginals = JSON.parse(pistesStr);
                  pistesActuals = JSON.parse(JSON.stringify(pistesOriginals));
                  
                  console.log('✅ Pistes parsejades correctament!');
                  console.log('📊 Lletres del joc:', lletresCentrals.join(', '));
                  console.log('📊 Prefixos-2:', Object.keys(pistesOriginals['prefixos-2'] || {}).length, 'elements');
                  console.log('📊 Graella:', pistesOriginals['graella'] ? pistesOriginals['graella'].length : 0, 'files');
                  
                  return true;
                } catch (parseError) {
                  console.error('❌ Error parsejant JSON:', parseError);
                  console.error('📄 String que ha fallat:', pistesStr.substring(0, 200));
                }
              }
            }
          }
        }
        
        // MÈTODE ALTERNATIU: Si no trobem game_number, buscar només var t=
        if (!pistesOriginals && content.includes('var t=') && content.includes('pistes')) {
          console.log(`⚠️ Usant mètode alternatiu per script ${i}`);
          
          // Extreure les lletres: "l":["e","j","o","p","r","t","c"]
          const lletresMatch = content.match(/"l"\s*:\s*\[([^\]]+)\]/);
          if (lletresMatch) {
            const lletresArray = lletresMatch[1].match(/"([^"]+)"/g);
            if (lletresArray) {
              lletresCentrals = lletresArray.map(l => l.replace(/"/g, ''));
              console.log('✓ Lletres extretes:', lletresCentrals);
            }
          }
          
          // Extreure les pistes
          const pistesMatch = content.match(/"pistes"\s*:\s*"(\{[^"]*\})(?:\\n)?"/);
          
          if (pistesMatch) {
            console.log('✓ Pistes trobades amb regex!');
            
            let pistesStr = pistesMatch[1];
            pistesStr = pistesStr.replace(/'/g, '"');
            pistesStr = pistesStr.replace(/\\"/g, '"');
            pistesStr = pistesStr.trim();
            
            try {
              pistesOriginals = JSON.parse(pistesStr);
              pistesActuals = JSON.parse(JSON.stringify(pistesOriginals));
              
              console.log('✅ Pistes parsejades correctament!');
              return true;
            } catch (parseError) {
              console.error('❌ Error parsejant JSON:', parseError);
            }
          }
        }
      }
      
      console.error('❌ No s\'ha trobat o no s\'ha pogut parsejar la variable t');
    } catch (error) {
      console.error('❌ Error general extraient pistes:', error);
    }
    
    return false;
  }

  // Detectar paraules descobertes
  function detectarParaulesDescobertes() {
    try {
      // Buscar a localStorage
      const dateKey = document.body.getAttribute('data-joc');
      if (dateKey) {
        const wordsKey = 'words_' + dateKey;
        const savedWords = localStorage.getItem(wordsKey);
        if (savedWords) {
          paraulesDescobertes = JSON.parse(savedWords);
          console.log('📝 Paraules descobertes:', paraulesDescobertes);
          return true;
        }
      }
    } catch (error) {
      console.error('❌ Error detectant paraules:', error);
    }
    return false;
  }

  // Extreure solucions des del codi JavaScript de la pàgina (igual que les pistes)
  function extreureSolucions() {
    try {
      console.log('🔍 Buscant solucions amb regex...');

      const scripts = document.getElementsByTagName('script');

      // Buscar el script que té la variable t amb les solucions
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const content = script.textContent;

        // Script que conté var t={...}
        if (content.includes('var t=')) {
          console.log(`✓ Script amb variable t trobat (script ${i})`);

          // Buscar var t={...};
          const varPattern = /var t\s*=\s*(\{[\s\S]*?\});/m;
          const varMatch = content.match(varPattern);

          if (varMatch) {
            const objectContent = varMatch[1];

            // Buscar la propietat "p" que conté les solucions
            // Format: "p":{"paraula1": "paraula1","paraula2": "paraula2",...}
            const pIndex = objectContent.indexOf('"p":');

            if (pIndex !== -1) {
              console.log('✓ Trobat "p" a la posició', pIndex);

              // Extreure des de "p":{ fins a },"pistes" (la següent propietat)
              // o fins al final si "pistes" no existeix
              let pContent;
              const pistesIndex = objectContent.indexOf(',"pistes"', pIndex);

              if (pistesIndex !== -1) {
                pContent = objectContent.substring(pIndex, pistesIndex);
              } else {
                // Buscar altres possibles propietats després de "p"
                const nextPropMatch = objectContent.substring(pIndex + 10).match(/,"\w+":/);
                if (nextPropMatch) {
                  const nextPropIndex = pIndex + 10 + nextPropMatch.index;
                  pContent = objectContent.substring(pIndex, nextPropIndex);
                } else {
                  // Si no trobem cap altra propietat, agafar fins al final (menys l'últim })
                  pContent = objectContent.substring(pIndex);
                }
              }

              console.log('📄 Longitud contingut "p":', pContent.length, 'caràcters');
              console.log('📄 Fragment:', pContent.substring(0, 200) + '...');

              // Extreure totes les claus de l'objecte p
              // Format: "paraula": "valor" o paraula: "valor"
              // Les claus són les paraules que busquem
              const wordsMatch = pContent.match(/"([a-zàèéíòóúïüç\-]+)":/gi);

              if (wordsMatch && wordsMatch.length > 0) {
                // La primera match és "p" així que la saltem
                solucions = wordsMatch
                  .map(w => w.replace(/["':]/g, '').trim())
                  .filter(w => w !== 'p' && w.length > 0);

                console.log('✅ Solucions trobades:', solucions.length, 'paraules');
                console.log('📝 Primers 10 exemples:', solucions.slice(0, 10));
                console.log('📝 Últims 5 exemples:', solucions.slice(-5));
                return true;
              } else {
                console.log('❌ No s\'han pogut extreure les paraules del contingut de "p"');
              }
            } else {
              console.log('❌ "p" no trobat al contingut de var t');
            }
          }
        }
      }

      console.log('⚠️ No s\'han trobat solucions als scripts');
      return false;
    } catch (error) {
      console.error('❌ Error extraient solucions:', error);
    }
    return false;
  }

  // Validar si la combinació actual pot formar alguna paraula
  function potFormarParaula(prefix) {
    if (!prefix || prefix.length === 0) return true;
    if (solucions.length === 0) return true;

    // Crear una llista de solucions que NO han estat descobertes encara
    const solucionsRestants = solucions.filter(sol =>
      !paraulesDescobertes.includes(sol)
    );

    // Comprovar si alguna solució restant comença amb aquest prefix
    const paraulesPossibles = solucionsRestants.filter(paraula =>
      paraula.startsWith(prefix.toLowerCase())
    );

    return paraulesPossibles.length > 0;
  }

  // Mostrar/amagar avís d'error
  function mostrarAvisNoValid() {
    // Mostrar punt vermell petit al costat de la paraula
    let avis = document.getElementById('paraulogic-avis-invalid');

    if (!avis) {
      avis = document.createElement('div');
      avis.id = 'paraulogic-avis-invalid';
      avis.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: #ff3b30;
        border-radius: 50%;
        z-index: 100000;
        box-shadow: 0 0 10px rgba(255, 59, 48, 0.8);
        animation: pulse 0.3s ease-in-out;
        pointer-events: none;
      `;

      // Posicionar el punt al costat de #test-word
      const testWordElement = document.getElementById('test-word');
      const inputWordElement = document.getElementById('input-word');

      if (testWordElement && inputWordElement) {
        // Afegir el punt dins del contenidor de la paraula
        inputWordElement.style.position = 'relative';
        avis.style.right = '-20px';
        avis.style.top = '50%';
        avis.style.transform = 'translateY(-50%)';
        inputWordElement.appendChild(avis);
      } else {
        // Fallback: posició fixa si no trobem els elements
        avis.style.position = 'fixed';
        avis.style.top = '20px';
        avis.style.right = '20px';
        document.body.appendChild(avis);
      }

      // Afegir animació pulse
      if (!document.getElementById('paraulogic-avis-style')) {
        const style = document.createElement('style');
        style.id = 'paraulogic-avis-style';
        style.textContent = `
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.7; }
          }
        `;
        document.head.appendChild(style);
      }

      // Esborrar després de 500ms
      setTimeout(() => {
        if (avis && avis.parentNode) {
          avis.remove();
        }
      }, 500);
    }

    // Esborrar l'última lletra automàticament
    esborrarUltimaLletra();
  }

  // Esborrar l'última lletra de la paraula actual
  function esborrarUltimaLletra() {
    // Buscar el botó "Suprimeix" i clicar-lo
    const btnSuprimeix = Array.from(document.querySelectorAll('button, div[role="button"]'))
      .find(btn => btn.textContent?.toLowerCase().includes('suprimeix'));

    if (btnSuprimeix) {
      btnSuprimeix.click();
      return;
    }

    // Alternativa: simular tecla Backspace
    const testWordElement = document.getElementById('test-word');
    if (testWordElement && testWordElement.textContent) {
      const text = testWordElement.textContent;
      if (text.length > 0) {
        // Disparar event de teclat
        const backspaceEvent = new KeyboardEvent('keydown', {
          key: 'Backspace',
          code: 'Backspace',
          keyCode: 8,
          which: 8,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(backspaceEvent);
      }
    }
  }

  // Detectar quan l'usuari clica les lletres i va formant paraules
  function monitoritzarInput() {
    console.log('👀 Monitoritzant input de l\'usuari...');

    // Mètode 1: Observar TOTS els canvis al DOM
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        const paraula = obtenerParaulaActual();
        if (paraula && paraula !== ultimaParaulaValidada) {
          console.log('🔍 Paraula detectada:', paraula);
          validarParaulaActual(paraula);
          ultimaParaulaValidada = paraula;
        }
      }, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });

    // Mètode 2: Detectar clics a QUALSEVOL lloc de la pàgina
    document.addEventListener('click', (e) => {
      setTimeout(() => {
        const paraula = obtenerParaulaActual();
        if (paraula && paraula !== ultimaParaulaValidada) {
          console.log('🖱️ Click detectat, paraula:', paraula);
          validarParaulaActual(paraula);
          ultimaParaulaValidada = paraula;
        }
      }, 100);
    }, true); // useCapture = true per capturar TOTS els clicks

    // Mètode 3: Detectar input del teclat
    document.addEventListener('keydown', (e) => {
      setTimeout(() => {
        const paraula = obtenerParaulaActual();
        if (paraula && paraula !== ultimaParaulaValidada) {
          console.log('⌨️ Tecla premuda, paraula:', paraula);
          validarParaulaActual(paraula);
          ultimaParaulaValidada = paraula;
        }
      }, 100);
    });

    // Mètode 4: Polling (comprovar cada 500ms)
    setInterval(() => {
      const paraula = obtenerParaulaActual();
      if (paraula && paraula !== ultimaParaulaValidada) {
        console.log('⏱️ Polling detectat, paraula:', paraula);
        validarParaulaActual(paraula);
        ultimaParaulaValidada = paraula;
      }
    }, 500);

    console.log('✅ Monitorització activada amb 4 mètodes diferents');
  }

  // Obtenir la paraula actual que està escrivint l'usuari
  function obtenerParaulaActual() {
    // Mètode 1: Buscar directament l'element #test-word (és on està la paraula!)
    const testWordElement = document.getElementById('test-word');
    if (testWordElement) {
      const text = testWordElement.textContent?.trim();
      if (text && text.length > 0) {
        return text;
      }
    }

    // Mètode 2: Buscar al DOM (altres possibles llocs)
    const possibleSelectors = [
      '#input-word span:first-child', // Específicament el primer span dins de #input-word
      'div[style*="font-size"][style*="text-align: center"]',
      '.word-input',
      '.current-word',
      '#current-word',
      '[data-word]',
      '.paraula-actual'
    ];

    for (let selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (let element of elements) {
        const text = element.textContent?.trim();
        // Comprovar si és una paraula vàlida (només lletres catalanes, 1+ caràcters)
        if (text && text.length > 0 && /^[a-zàèéíòóúïüç]+$/i.test(text)) {
          // Evitar que sigui part de la UI o el cursor
          if (!['suprimeix', 'introdueix', 'graella', 'prefixos', 'sufixos', '|'].includes(text.toLowerCase())) {
            return text;
          }
        }
      }
    }

    return '';
  }

  // Validar la paraula actual
  function validarParaulaActual(paraula) {
    if (!validacioActiva) {
      return;
    }

    if (!paraula || paraula.length === 0) {
      return;
    }

    // Guardar paraula actual
    paraulaActual = paraula.toLowerCase();

    // Només validar si tenim solucions carregades
    if (solucions.length === 0) {
      return;
    }

    // Comprovar si pot formar alguna paraula nova (exclou les ja descobertes)
    const potFormar = potFormarParaula(paraulaActual);

    if (!potFormar && paraulaActual.length >= 1) {
      // Mostrar avís si no pot formar cap paraula nova
      console.log('🚨 AVÍS: "' + paraulaActual + '" no pot formar cap paraula nova');
      mostrarAvisNoValid();
    }
  }

  // Actualitzar pistes segons paraules descobertes
  function recalcularPistes() {
    if (!pistesOriginals) return;

    // Resetar pistes a l'original
    pistesActuals = JSON.parse(JSON.stringify(pistesOriginals));

    // Actualitzar per cada paraula descoberta
    paraulesDescobertes.forEach(paraula => {
      actualitzarPistesAmbParaula(paraula);
    });
  }

  // Actualitzar pistes amb una paraula
  function actualitzarPistesAmbParaula(paraula) {
    const longitud = paraula.length.toString();
    const primeraLletra = paraula[0];

    // Actualitzar graella
    if (pistesActuals['graella']) {
      for (let i = 0; i < pistesActuals['graella'].length; i++) {
        let fila = pistesActuals['graella'][i].split(',');
        if (fila[0] === primeraLletra) {
          const columnaIndex = parseInt(longitud) - 2;
          if (columnaIndex > 0 && columnaIndex < fila.length - 1) {
            let valor = parseInt(fila[columnaIndex]);
            if (!isNaN(valor) && valor > 0) {
              fila[columnaIndex] = (valor - 1).toString();
              let suma = 0;
              for (let j = 1; j < fila.length - 1; j++) {
                suma += parseInt(fila[j]) || 0;
              }
              fila[fila.length - 1] = suma.toString();
              pistesActuals['graella'][i] = fila.join(',');
            }
          }
          break;
        }
      }

      // Actualitzar fila de sumes
      let ultimaFila = pistesActuals['graella'][pistesActuals['graella'].length - 1].split(',');
      for (let col = 1; col < ultimaFila.length - 1; col++) {
        let suma = 0;
        for (let fila = 1; fila < pistesActuals['graella'].length - 1; fila++) {
          let valorFila = pistesActuals['graella'][fila].split(',')[col];
          suma += parseInt(valorFila) || 0;
        }
        ultimaFila[col] = suma.toString();
      }
      let sumaTotal = 0;
      for (let col = 1; col < ultimaFila.length - 1; col++) {
        sumaTotal += parseInt(ultimaFila[col]) || 0;
      }
      ultimaFila[ultimaFila.length - 1] = sumaTotal.toString();
      pistesActuals['graella'][pistesActuals['graella'].length - 1] = ultimaFila.join(',');
    }

    // Actualitzar prefixos de 2 lletres
    if (paraula.length >= 2 && pistesActuals['prefixos-2']) {
      const prefix2 = paraula.substring(0, 2);
      if (pistesActuals['prefixos-2'][prefix2]) {
        pistesActuals['prefixos-2'][prefix2]--;
        if (pistesActuals['prefixos-2'][prefix2] <= 0) {
          delete pistesActuals['prefixos-2'][prefix2];
        }
      }
    }

    // Actualitzar prefixos de 3 lletres
    if (paraula.length >= 3 && pistesActuals['prefix']) {
      const prefix3 = paraula.substring(0, 3);
      if (pistesActuals['prefix']['prefixos'] && pistesActuals['prefix']['prefixos'].includes(prefix3)) {
        if (pistesActuals['prefix']['freq']) {
          pistesActuals['prefix']['freq']--;
          if (pistesActuals['prefix']['freq'] <= 0) {
            pistesActuals['prefix'] = {};
          }
        }
      }
    }

    // Actualitzar sufixos de 3 lletres
    if (paraula.length >= 3 && pistesActuals['sufix-3']) {
      const sufix3 = paraula.substring(paraula.length - 3);
      if (pistesActuals['sufix-3'][sufix3]) {
        pistesActuals['sufix-3'][sufix3]--;
        if (pistesActuals['sufix-3'][sufix3] <= 0) {
          delete pistesActuals['sufix-3'][sufix3];
        }
      }
    }

    // Actualitzar tutis
    if (esTotesLletres(paraula) && pistesActuals['tutis']) {
      if (pistesActuals['tutis'][longitud]) {
        pistesActuals['tutis'][longitud]--;
        if (pistesActuals['tutis'][longitud] <= 0) {
          delete pistesActuals['tutis'][longitud];
        }
      }
    }

    // Actualitzar palíndroms
    if (esPalindrom(paraula) && pistesActuals['palindroms']) {
      if (pistesActuals['palindroms'][longitud]) {
        pistesActuals['palindroms'][longitud]--;
        if (pistesActuals['palindroms'][longitud] <= 0) {
          delete pistesActuals['palindroms'][longitud];
        }
      }
    }

    // Actualitzar mots quadrats
    if (esMotQuadrat(paraula) && pistesActuals['quadrats']) {
      if (pistesActuals['quadrats'][longitud]) {
        pistesActuals['quadrats'][longitud]--;
        if (pistesActuals['quadrats'][longitud] <= 0) {
          delete pistesActuals['quadrats'][longitud];
        }
      }
    }

    // Actualitzar subconjunts
    if (pistesActuals['subconjunts']) {
      const subconjunt = getSubconjunt(paraula);
      if (pistesActuals['subconjunts'][subconjunt]) {
        pistesActuals['subconjunts'][subconjunt]--;
        if (pistesActuals['subconjunts'][subconjunt] <= 0) {
          delete pistesActuals['subconjunts'][subconjunt];
        }
      }
    }
  }

  // Funcions auxiliars
  function esTotesLletres(paraula) {
    return lletresCentrals.every(lletra => paraula.includes(lletra));
  }

  function esPalindrom(paraula) {
    return paraula === paraula.split('').reverse().join('');
  }

  function esMotQuadrat(paraula) {
    const longitud = paraula.length;
    if (longitud % 2 !== 0) return false;
    const meitat = longitud / 2;
    return paraula.substring(0, meitat) === paraula.substring(meitat);
  }

  function getSubconjunt(paraula) {
    return [...new Set(paraula)].sort().join('');
  }

  // Generar HTML de les pistes
  function generarHTMLPistes() {
    if (!pistesActuals) return '<div class="pistes-error">No s\'han pogut carregar les pistes</div>';

    let html = '';

    // Graella
    html += '<div class="pistes-section"><h4>📊 Graella</h4><table class="pistes-graella">';
    if (pistesActuals['graella']) {
      pistesActuals['graella'].forEach((fila, index) => {
        html += '<tr>';
        fila.split(',').forEach((cell, cellIndex) => {
          const cellClean = cell.replace(/&nbsp;|\\u03a3/g, match => {
            if (match === '&nbsp;') return ' ';
            if (match === '\\u03a3') return 'Σ';
            return match;
          });
          
          if (index === 0 || cellIndex === 0) {
            html += `<th>${cellClean}</th>`;
          } else {
            const classe = cellClean === '0' ? ' class="zero"' : '';
            html += `<td${classe}>${cellClean}</td>`;
          }
        });
        html += '</tr>';
      });
    }
    html += '</table></div>';

    // Prefixos de 2 lletres
    if (pistesActuals['prefixos-2'] && Object.keys(pistesActuals['prefixos-2']).length > 0) {
      html += '<div class="pistes-section"><h4>🔤 Prefixos de 2 lletres</h4><div class="pistes-list">';
      Object.entries(pistesActuals['prefixos-2'])
        .sort()
        .forEach(([prefix, count]) => {
          html += `<span class="pista-item">${prefix}-${count}</span>`;
        });
      html += '</div></div>';
    }

    // Prefixos de 3 lletres
    if (pistesActuals['prefix'] && pistesActuals['prefix']['prefixos']) {
      html += '<div class="pistes-section"><h4>🔤 Prefix freqüent de 3 lletres</h4><div class="pistes-list">';
      pistesActuals['prefix']['prefixos'].forEach(prefix => {
        html += `<span class="pista-item">${prefix}-${pistesActuals['prefix']['freq']}</span>`;
      });
      html += '</div></div>';
    }

    // Sufixos de 3 lletres
    if (pistesActuals['sufix-3'] && Object.keys(pistesActuals['sufix-3']).length > 0) {
      html += '<div class="pistes-section"><h4>🔤 Sufixos de 3 lletres</h4><div class="pistes-list">';
      Object.entries(pistesActuals['sufix-3'])
        .sort()
        .forEach(([sufix, count]) => {
          html += `<span class="pista-item">${sufix}-${count}</span>`;
        });
      html += '</div></div>';
    }

    // Tutis
    if (pistesActuals['tutis'] && Object.keys(pistesActuals['tutis']).length > 0) {
      const numTutis = Object.values(pistesActuals['tutis']).reduce((a, b) => a + b, 0);
      html += '<div class="pistes-section"><h4>⭐ Tutis</h4><div class="pistes-text">';
      html += `Hi ha ${numTutis} tutis: `;
      Object.entries(pistesActuals['tutis']).forEach(([longitud, count]) => {
        html += `${count} de ${longitud} lletres `;
      });
      html += '</div></div>';
    }

    // Palíndroms
    if (pistesActuals['palindroms'] && Object.keys(pistesActuals['palindroms']).length > 0) {
      const numPalindroms = Object.values(pistesActuals['palindroms']).reduce((a, b) => a + b, 0);
      html += '<div class="pistes-section"><h4>🔄 Palíndroms</h4><div class="pistes-text">';
      html += `Hi ha ${numPalindroms} palíndroms: `;
      Object.entries(pistesActuals['palindroms']).forEach(([longitud, count]) => {
        html += `${count} de ${longitud} lletres `;
      });
      html += '</div></div>';
    }

    // Mots quadrats
    if (pistesActuals['quadrats'] && Object.keys(pistesActuals['quadrats']).length > 0) {
      const numQuadrats = Object.values(pistesActuals['quadrats']).reduce((a, b) => a + b, 0);
      html += '<div class="pistes-section"><h4>⬛ Mots quadrats</h4><div class="pistes-text">';
      html += `Hi ha ${numQuadrats} mots quadrats: `;
      Object.entries(pistesActuals['quadrats']).forEach(([longitud, count]) => {
        html += `${count} de ${longitud} lletres `;
      });
      html += '</div></div>';
    }

    // Subconjunts
    if (pistesActuals['subconjunts'] && Object.keys(pistesActuals['subconjunts']).length > 0) {
      html += '<div class="pistes-section"><h4>📦 Subconjunts</h4><div class="pistes-list">';
      Object.entries(pistesActuals['subconjunts'])
        .sort()
        .forEach(([subconj, count]) => {
          html += `<span class="pista-item">${subconj}-${count}</span>`;
        });
      html += '</div></div>';
    }

    // Info
    html += '<div class="pistes-info">📝 ' + paraulesDescobertes.length + ' paraules descobertes</div>';

    return html;
  }

  // Actualitzar el panell de pistes
  function actualitzarPanellPistes() {
    detectarParaulesDescobertes();
    recalcularPistes();
    const content = document.getElementById('pistes-content');
    if (content) {
      content.innerHTML = generarHTMLPistes();
    }
  }

  // Observar canvis al localStorage per detectar noves paraules
  function observarCanvis() {
    const dateKey = document.body.getAttribute('data-joc');
    if (!dateKey) return;

    const wordsKey = 'words_' + dateKey;
    let ultimesParaules = paraulesDescobertes.length;

    setInterval(() => {
      const savedWords = localStorage.getItem(wordsKey);
      if (savedWords) {
        const paraules = JSON.parse(savedWords);
        if (paraules.length !== ultimesParaules) {
          console.log('🔄 Nova paraula detectada! Actualitzant pistes...');
          ultimesParaules = paraules.length;
          actualitzarPanellPistes();
        }
      }
    }, 1000); // Comprovar cada segon
  }

  // Inicialització
  function inicialitzar() {
    console.log('🚀 Inicialitzant extensió Paraulògic - Pistes Dinàmiques v2.0...');
    console.log('📍 URL actual:', window.location.href);
    console.log('📍 readyState:', document.readyState);
    
    let success = extreurePistes();
    
    if (success) {
      console.log('✅ Pistes extretes! Creant panell...');
      crearPanellPistes();
      detectarParaulesDescobertes();
      recalcularPistes();
      actualitzarPanellPistes();
      observarCanvis();

      // Inicialitzar validació de paraules (amb múltiples retries)
      let intentsRestants = 8;
      const intentarExtreureSolucions = () => {
        const success = extreureSolucions();

        if (success) {
          console.log('✅ Validació de paraules activada!');
          return;
        }

        intentsRestants--;
        if (intentsRestants > 0) {
          setTimeout(intentarExtreureSolucions, 2500);
        } else {
          console.warn('⚠️ Validació no disponible (no s\'ha trobat t.p)');
        }
      };

      // Esperar 3 segons abans del primer intent
      setTimeout(intentarExtreureSolucions, 3000);
      monitoritzarInput();

      console.log('✅ Extensió inicialitzada correctament!');
      console.log('🎯 El panell hauria d\'aparèixer a la dreta de la pantalla');
    } else {
      console.warn('⚠️ No s\'han pogut extreure les pistes en el primer intent');
      console.log('🔄 Reintentant en 3 segons...');
      
      // Reintentar després de 3 segons (dona més temps perquè es carreguin els scripts)
      setTimeout(() => {
        console.log('🔄 Segon intent d\'extracció...');
        success = extreurePistes();
        
        if (success) {
          console.log('✅ Pistes extretes al segon intent!');
          crearPanellPistes();
          detectarParaulesDescobertes();
          recalcularPistes();
          actualitzarPanellPistes();
          observarCanvis();

          // Inicialitzar validació de paraules (amb múltiples retries)
          let intentsRestants = 5;
          const intentarExtreureSolucions = () => {
            console.log(`🔄 Intent ${6 - intentsRestants}/5 d'extreure solucions...`);
            const success = extreureSolucions();

            if (success) {
              console.log('✅ Validació activada correctament!');
              return;
            }

            intentsRestants--;
            if (intentsRestants > 0) {
              const delay = 1500; // 1.5 segons entre intents
              console.log(`⏳ Reintentant en ${delay}ms... (intents restants: ${intentsRestants})`);
              setTimeout(intentarExtreureSolucions, delay);
            } else {
              console.error('❌ No s\'han pogut extreure les solucions després de 5 intents');
              console.error('💡 La validació de paraules no estarà disponible');
            }
          };

          // Esperar 500ms abans del primer intent (dona temps al window.t)
          setTimeout(intentarExtreureSolucions, 500);
          monitoritzarInput();

          console.log('✅ Extensió inicialitzada correctament!');
        } else {
          console.error('❌ No s\'han pogut extreure les pistes després de 2 intents');
          console.error('💡 Possibles causes:');
          console.error('   1. El format del Paraulògic ha canviat');
          console.error('   2. Estàs a una pàgina diferent (solucions, estadístiques, etc.)');
          console.error('   3. Hi ha un problema de càrrega dels scripts');
          
          // Mostrar missatge a l'usuari
          const missatge = document.createElement('div');
          missatge.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: sans-serif;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            max-width: 300px;
          `;
          missatge.innerHTML = `
            <strong>⚠️ Extensió Paraulògic</strong><br>
            No s'han pogut carregar les pistes.<br>
            <small>Comprova que estàs a la pàgina principal.<br>
            Obre la consola (F12) per més detalls.</small>
          `;
          document.body.appendChild(missatge);
          
          // Afegir botó per tancar
          setTimeout(() => {
            if (missatge.parentNode) {
              missatge.style.cursor = 'pointer';
              missatge.onclick = () => missatge.remove();
            }
          }, 100);
          
          setTimeout(() => {
            if (missatge.parentNode) missatge.remove();
          }, 10000);
        }
      }, 3000);
    }
  }

  // Esperar que la pàgina es carregui completament
  if (document.readyState === 'loading') {
    console.log('⏳ Esperant DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(inicialitzar, 1000); // Donar temps extra
    });
  } else {
    console.log('✓ DOM ja carregat, inicialitzant...');
    setTimeout(inicialitzar, 1000); // Donar temps perquè es carreguin els scripts
  }

})();
