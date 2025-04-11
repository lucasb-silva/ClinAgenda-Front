<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { DefaultTemplate } from '@/template'
import { mdiPlusCircle, mdiTrashCan, mdiSquareEditOutline } from '@mdi/js'
import type { IDoctor, GetDoctorListResponse } from '@/interfaces/doctor'
import type { GetSpecialtyListResponse, ISpecialty } from '@/interfaces/specialty'
import type { GetPatientListResponse, IPatient } from '@/interfaces/patient'
import type {
  GetAppointmentListRequest,
  GetAppointmentListResponse,
  IAppointment
} from '@/interfaces/appointment'
import { useToastStore } from '@/stores'
import request from '@/engine/httpClient'

const toastStore = useToastStore()

const isLoadingList = ref<boolean>(false)
const isLoadingFilter = ref<boolean>(false)

const filterSpecialtyId = ref<ISpecialty['id'] | null>(null)
// const filterDoctorId = ref<IDoctor['id'] | null>(null)
// const filterPatientId = ref<IPatient['id'] | null>(null)

const filterDoctorName = ref<IDoctor['name']>('')
const filterPatientName = ref<IPatient['name']>('')

const itemsPerPage = ref<number>(10)
const total = ref<number>(0)
const page = ref<number>(1)
const items = ref<IAppointment[]>([])

const specialtyItems = ref<ISpecialty[]>([])
const doctorItems = ref<IDoctor[]>([])
const patientItems = ref<IPatient[]>([])

const headers = [
  {
    title: 'ID',
    key: 'id',
    sortable: false,
    width: 0,
    cellProps: { class: 'text-no-wrap' }
  },
  { title: 'Paciente', key: 'patient', sortable: false },
  { title: 'CPF', key: 'documentNumber', sortable: false },
  { title: 'Médico', key: 'doctor', sortable: false },
  { title: 'Especialidade', key: 'specialty', sortable: false },
  { title: 'Horario da consulta', key: 'appointmentDate', sortable: false },
  {
    title: 'Ações',
    key: 'actions',
    sortable: false,
    width: 0,
    cellProps: { class: 'text-no-wrap' }
  }
]

const handleDataTableUpdate = async ({ page: tablePage, itemsPerPage: tableItemsPerPage }: any) => {
  page.value = tablePage
  itemsPerPage.value = tableItemsPerPage
  loadDataTable()
}

// Seta o isLoadingList como true para mostrar mensagem de carregamento enquanto aguarda os dados da tabela pela requisição GetDoctorListRequest
const loadDataTable = async () => {
  isLoadingList.value = true
  const { isError, data } = await request<GetAppointmentListRequest, GetAppointmentListResponse>({
    method: 'GET',
    endpoint: 'appointment/list',
    body: {
      itemsPerPage: itemsPerPage.value,
      page: page.value,
      patientName: filterPatientName.value,
      doctorName: filterDoctorName.value,
      specialtyId: filterSpecialtyId.value
    }
  })

  if (isError) return

  items.value = data.items
  total.value = data.total
  isLoadingList.value = false
}

const loadFilters = async () => {
  isLoadingFilter.value = true

  const doctorRequest = request<undefined, GetDoctorListResponse>({
    method: 'GET',
    endpoint: 'doctor/list'
  })

  const requests: Promise<any>[] = [doctorRequest]

  const specialtyRequest = request<undefined, GetSpecialtyListResponse>({
    method: 'GET',
    endpoint: 'specialty/list'
  })

  requests.push(specialtyRequest)

  const patientRequest = request<undefined, GetPatientListResponse>({
    method: 'GET',
    endpoint: 'patient/list'
  })

  requests.push(patientRequest)

  try {
    const [doctorResponse, specialtyResponse, patientResponse] = await Promise.all(requests)

    if (doctorResponse.isError || specialtyResponse.isError || patientResponse.isError) return

    doctorItems.value = doctorResponse.data.items
    specialtyItems.value = specialtyResponse.data.items
    patientItems.value = patientResponse.data.items
  } catch (e) {
    console.error('Erro ao buscar items do filtro', e)
  }

  isLoadingFilter.value = false
}

const deleteListItem = async (item: IAppointment) => {
  const shouldDelete = confirm(`Deseja mesmo deletar consulta do dia ${item.appointmentDate}?`)

  if (!shouldDelete) return

  const response = await request<null, null>({
    method: 'DELETE',
    endpoint: `appointment/delete/${item.id}`
  })

  if (response.isError) return

  toastStore.setToast({
    type: 'success',
    text: 'Agendamento deletado com sucesso!'
  })

  loadDataTable()
}

onMounted(() => {
  loadFilters()
})
</script>

<template>
  <default-template>
    <template #title> Agendamentos cadastrados </template>

    <template #action>
      <v-btn color="secondary" :prepend-icon="mdiPlusCircle" :to="{ name: 'doctor-insert' }">
        Adicionar consulta
      </v-btn>
    </template>

    <template #default>
      <v-sheet class="pa-4 mb-4">
        <v-form @submit.prevent="loadDataTable">
          <v-row>
            <v-col>
              <v-text-field v-model.trim="filterDoctorName" label="Médico" hide-details />
            </v-col>
            <v-col>
              <v-text-field v-model.trim="filterPatientName" label="Paciente" hide-details />
            </v-col>
            <v-col>
              <v-select
                v-model="filterSpecialtyId"
                label="Especialidade"
                :loading="isLoadingFilter"
                :items="specialtyItems"
                item-value="id"
                item-title="name"
                clearable
                hide-details
              />
            </v-col>
            <v-col cols="auto" class="d-flex align-center">
              <v-btn color="secondary" type="submit">Filtrar</v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-sheet>

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items-length="total"
        :items="items"
        :loading="isLoadingList"
        item-value="id"
        @update:options="handleDataTableUpdate"
      >
      <template #[`item.patient`]="{ item }">
          {{ item.patient.name }} 
        </template>
        <template #[`item.documentNumber`]="{ item }">
           {{ item.patient.documentNumber }}
        </template>
        <template #[`item.doctor`]="{ item }">
           {{ item.doctor.name }}
        </template>
        <template #[`item.specialty`]="{ item }">
          <v-chip> {{ item.specialty.name }} </v-chip>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-tooltip text="Deletar médico" location="left">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                :icon="mdiTrashCan"
                size="small"
                color="error"
                class="mr-2"
                @click="deleteListItem(item)"
              />
            </template>
          </v-tooltip>
          <v-tooltip text="Editar médico" location="left">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                :icon="mdiSquareEditOutline"
                size="small"
                color="primary"
                :to="{ name: 'doctor-update', params: { id: item.id } }"
              />
            </template>
          </v-tooltip>
        </template>
      </v-data-table-server>
    </template>
  </default-template>
</template>
