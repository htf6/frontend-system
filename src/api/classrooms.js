import request from '@/utils/request'

export function getClassrooms(params) {
  return request({
    url: '/api/classrooms',
    method: 'get',
    params
  })
}

export function getClassroomById(id) {
  return request({
    url: `/api/classrooms/${id}`,
    method: 'get'
  })
}

export function getClassroomTree() {
  return request({
    url: '/api/classrooms/tree',
    method: 'get'
  })
}

export function createClassroom(data) {
  return request({
    url: '/api/classrooms',
    method: 'post',
    data
  })
}

export function updateClassroom(id, data) {
  return request({
    url: `/api/classrooms/${id}`,
    method: 'put',
    data
  })
}

export function updateClassroomStatus(id, status) {
  return request({
    url: `/api/classrooms/${id}/status`,
    method: 'patch',
    data: { status }
  })
}

export function deleteClassroom(id) {
  return request({
    url: `/api/classrooms/${id}`,
    method: 'delete'
  })
}

export function importClassrooms(data) {
  return request({
    url: '/api/classrooms/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
