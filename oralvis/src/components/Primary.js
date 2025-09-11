import React from 'react'
import PatientSubmissionForm from './Patient_dash'
import SubmissionRecords from './SubmissionRecords'

function Primary() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 space-y-8">
    
    <PatientSubmissionForm/>

    <SubmissionRecords/>


    
    
    </div>
  )
}

export default Primary