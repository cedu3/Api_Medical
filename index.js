const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'clinica_audiologica'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Conectado a la base de datos MySQL!');
});

app.use(cors());
app.use(bodyParser.json());

function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) 
    month = '0' + month;
  if (day.length < 2) 
    day = '0' + day;

  return [year, month, day].join('-');
}


 app.get('/pacientes', (req, res) => {
    connection.query('SELECT * FROM pacientes', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
  
  app.get('/pacientes/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM pacientes WHERE id = ?', [id], (err, results) => {
      if (err) throw err;
      res.json(results[0]);
    });
  });
  
  app.post('/pacientes', (req, res) => {
    const nuevoPaciente = req.body;
    nuevoPaciente.fechaNacimiento = new Date(nuevoPaciente.fechaNacimiento).toISOString().slice(0, 10);
    connection.query('INSERT INTO pacientes SET ?', nuevoPaciente, (err, result) => {
      if (err) throw err;
      res.status(201).json({ id: result.insertId, ...nuevoPaciente });
    });
  });
  
  app.put('/pacientes/:id', (req, res) => {
    const id = req.params.id;
    const datosActualizados = req.body;
  
    if (datosActualizados.fechaNacimiento) {
      datosActualizados.fechaNacimiento = formatDate(datosActualizados.fechaNacimiento);
    }
  
    connection.query('UPDATE pacientes SET ? WHERE id = ?', [datosActualizados, id], (err, result) => {
      if (err) {
        console.error('Error al actualizar el paciente:', err);
        res.status(500).send('Error al actualizar el paciente');
      } else {
        res.json({ id, ...datosActualizados });
      }
    });
  });
  
  app.delete('/pacientes/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM pacientes WHERE id = ?', [id], (err, result) => {
      if (err) throw err;
      res.json({ message: 'Paciente eliminado' });
    });
  });

  app.get('/citas', (req, res) => {
    const query = `
      SELECT 
        c.id, 
        c.fechaHora,
        p.id AS pacienteId, 
        p.nombre AS pacienteNombre, 
        e.id AS especialistaId, 
        e.nombre AS especialistaNombre
      FROM 
        citas c
      JOIN 
        pacientes p ON c.pacienteId = p.id
      JOIN 
        especialistas e ON c.especialistaId = e.id;
    `;
  
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener citas:', err);
        return res.status(500).json({ error: 'Error al obtener citas' });
      }
      res.json(results);
    });
  });
  
  app.get('/citas/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM citas WHERE id = ?', [id], (err, results) => {
      if (err) throw err;
      res.json(results[0]);
    });
  });
  
  app.post('/citas', (req, res) => {
    const nuevaCita = req.body;
    connection.query('INSERT INTO citas SET ?', nuevaCita, (err, result) => {
      if (err) throw err;
      res.status(201).json({ id: result.insertId, ...nuevaCita });
    });
  });
  
  app.put('/citas/:id', (req, res) => {
    const id = req.params.id;
    const { pacienteId, especialistaId, fechaHora } = req.body;

    const formattedDate = new Date(fechaHora).toISOString().slice(0, 19).replace('T', ' ');
  
    const query = `
      UPDATE citas 
      SET pacienteId = ?, especialistaId = ?, fechaHora = ? 
      WHERE id = ?
    `;
  
    connection.query(query, [pacienteId, especialistaId, formattedDate, id], (err, results) => {
      if (err) {
        console.error('Error updating the appointment:', err);
        res.status(500).json({ error: 'Error updating the appointment' });
        return;
      }
  
      res.json({ message: 'Appointment updated successfully' });
    });
  });
  
  app.delete('/citas/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM citas WHERE id = ?', [id], (err, result) => {
      if (err) throw err;
      res.json({ message: 'Cita eliminada' });
    });
  });


  app.get('/especialistas', (req, res) => {
    connection.query('SELECT * FROM especialistas', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
  
  app.get('/especialistas/:id', (req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM especialistas WHERE id = ?', [id], (err, results) => {
      if (err) throw err;
      res.json(results[0]);
    });
  });
  
  app.post('/especialistas', (req, res) => {
    const nuevoEspecialista = req.body;
    connection.query('INSERT INTO especialistas SET ?', nuevoEspecialista, (err, result) => {
      if (err) throw err;
      res.status(201).json({ id: result.insertId, ...nuevoEspecialista });
    });
  });
  
  app.put('/especialistas/:id', (req, res) => {
    const id = req.params.id;
    const datosActualizados = req.body;
    connection.query('UPDATE especialistas SET ? WHERE id = ?', [datosActualizados, id], (err, result) => {
      if (err) throw err;
      res.json({ id, ...datosActualizados });
    });
  });
  
  app.delete('/especialistas/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM especialistas WHERE id = ?', [id], (err, result) => {
      if (err) throw err;
      res.json({ message: 'Especialista eliminado' });
    });
  });

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
