import type { IDoctor } from './doctor'
import type { IPatient } from './patient'
import type { ISpecialty } from './specialty'

export interface IAppointment {
  id: number
  patient: IPatient
  doctor: IDoctor
  specialty: ISpecialty
  appointmentDate: string
  observation: string
}

export type GetAppointmentListRequest = {
  itemsPerPage: number
  page: number
  patientName: IPatient['name'] | null
  doctorName: IDoctor['name'] | null
  specialtyId: ISpecialty['id'] | null
}

export type GetAppointmentListResponse = {
  total: number
  items: IAppointment[]
}

export type AppointmentForm = {
  patientId: IPatient['id']
  doctorId: IDoctor['id']
  specialtyId: ISpecialty['id'][]
  appointmentDate: IAppointment['appointmentDate']
  observation: IAppointment['observation']
}
