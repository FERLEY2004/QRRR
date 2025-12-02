// Script para agregar personas de prueba a la base de datos
import pool from './dbPool.js';

const addTestPersons = async () => {
  try {
    console.log('📝 Agregando personas de prueba...');

    // Obtener ID del rol aprendiz
    const [roles] = await pool.execute(
      "SELECT id_rol FROM Roles WHERE nombre_rol = 'aprendiz' LIMIT 1"
    );
    const aprendizRolId = roles.length > 0 ? roles[0].id_rol : null;

    // Personas de prueba basadas en el QR escaneado
    const testPersons = [
      {
        nombres: 'FERLEY',
        apellidos: 'OROBIO PAZ',
        documento: '1061200351',
        tipo_documento: 'CC',
        id_rol: aprendizRolId,
        estado: 'ACTIVO'
      },
      {
        nombres: 'Juan',
        apellidos: 'Pérez García',
        documento: '1234567890',
        tipo_documento: 'CC',
        id_rol: aprendizRolId,
        estado: 'ACTIVO'
      },
      {
        nombres: 'María',
        apellidos: 'López Rodríguez',
        documento: '9876543210',
        tipo_documento: 'CC',
        id_rol: aprendizRolId,
        estado: 'ACTIVO'
      }
    ];

    for (const person of testPersons) {
      try {
        // Verificar si ya existe
        const [existing] = await pool.execute(
          'SELECT id_persona FROM Personas WHERE documento = ?',
          [person.documento]
        );

        const nombreCompleto = `${person.nombres} ${person.apellidos}`;
        if (existing.length === 0) {
          await pool.execute(
            `INSERT INTO Personas (nombres, apellidos, documento, tipo_documento, id_rol, estado) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [person.nombres, person.apellidos, person.documento, person.tipo_documento, person.id_rol, person.estado]
          );
          console.log(`✅ Persona creada: ${nombreCompleto} (${person.documento})`);
        } else {
          console.log(`ℹ️  Persona ya existe: ${nombreCompleto} (${person.documento})`);
        }
      } catch (error) {
        console.error(`❌ Error creando persona ${person.nombres} ${person.apellidos}:`, error.message);
      }
    }

    // Listar todas las personas
    const [allPersons] = await pool.execute(
      'SELECT id_persona, nombres, apellidos, documento, rol, estado FROM Personas ORDER BY fecha_registro DESC'
    );
    
    console.log('\n📋 Personas en la base de datos:');
    allPersons.forEach(p => {
      const nombreCompleto = `${p.nombres || ''} ${p.apellidos || ''}`.trim();
      console.log(`   - ${nombreCompleto} (${p.documento}) - ${p.rol} - ${p.estado}`);
    });

    console.log('\n✅ Personas de prueba agregadas');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // No cerrar el pool aquí, puede estar siendo usado por otros procesos
    process.exit(0);
  }
};

addTestPersons();

