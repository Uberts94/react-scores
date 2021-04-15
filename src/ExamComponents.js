import { Col, Table } from 'react-bootstrap';
import { useState } from 'react';
import { iconDelete, iconEdit } from './icons';


function ExamScores(props) {
  return <Col>
    <ExamTable exams={props.exams} courses={props.courses} />
  </Col>;
}

function ExamTable(props) {
  const [exams, setExams] = useState([...props.exams]);

  const deleteExam = (coursecode) => {
    setExams((exs) => exs.filter(ex => ex.coursecode !== coursecode))
  }


  return (
    <Table striped bordered>
      <thead>
        <tr>
          <th>Exam</th>
          <th>Score</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>{
        exams.map((ex) => <ExamRow key={ex.coursecode}
          exam={ex}
          examName={props.courses.filter(c => c.coursecode === ex.coursecode)[0].name}
          deleteExam={deleteExam}
        />)
        /* NOTE: exam={{...ex, name: (the above expression)}} could be a quicker (and dirtier) way to add the .name property to the exam, instead of passing the examName prop */
      }
      </tbody>
    </Table>
  );
}

function ExamRow(props) {
  return <tr><ExamRowData exam={props.exam} examName={props.examName} /><RowControls exam={props.exam} deleteExam={props.deleteExam} /></tr>
}

function ExamRowData(props) {
  return <>
    <td>{props.examName}</td>
    <td>{props.exam.score}</td>
    <td>{props.exam.date.format('DD MMM YYYY')}</td>
  </>;
}

function RowControls(props) {
  return <td>
    {iconEdit} <span onClick={() => { props.deleteExam(props.exam.coursecode) }}>{iconDelete}</span>
  </td>
}

export default ExamScores;