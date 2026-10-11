export async function requestTasks(): Promise<unknown> {
  return [
    { task_id: '1', title_text: 'Review pull request', is_done: false },
    { task_id: '2', title_text: 'Update dependencies', is_done: true },
    { task_id: '3', title_text: 'Write release notes', is_done: false },
    { task_id: '4', title_text: 'Check keyboard navigation', is_done: false },
    { task_id: '5', title_text: 'Document API changes', is_done: true },
    { task_id: '6', title_text: 'Run browser tests', is_done: false },
  ]
}
