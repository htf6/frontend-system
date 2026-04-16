import request from '@/utils/request'

export function importCourseSchedules(data, config = {}) {
  return request({
    url: '/api/course-schedules/import',
    method: 'post',
    timeout: 0,
    data,
    ...config
  })
}
