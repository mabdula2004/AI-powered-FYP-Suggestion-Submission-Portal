const BASE_URL = `https://api.github.com/repos/${import.meta.env.VITE_GITHUB_REPO_OWNER}/${import.meta.env.VITE_GITHUB_REPO_NAME}/contents`

const headers = {
  Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

async function uploadFile(path, base64Content, commitMessage) {
  const url = `${BASE_URL}/${path}`
  const body = {
    message: commitMessage,
    content: base64Content,
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to upload file: ${response.status}`)
  }

  const data = await response.json()
  return {
    downloadUrl: data.content?.download_url,
    sha: data.content?.sha,
  }
}

async function deleteFile(path, sha, commitMessage) {
  const url = `${BASE_URL}/${path}`
  const body = {
    message: commitMessage,
    sha,
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to delete file: ${response.status}`)
  }
}

async function getFileMeta(path) {
  const url = `${BASE_URL}/${path}`
  const response = await fetch(url, { headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to get file metadata: ${response.status}`)
  }

  return await response.json()
}

async function listFiles(folder) {
  const url = `${BASE_URL}/${folder}`
  const response = await fetch(url, { headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `Failed to list files: ${response.status}`)
  }

  return await response.json()
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1]
      resolve(base64String)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const githubStorageService = {
  uploadFile,
  deleteFile,
  getFileMeta,
  listFiles,
  fileToBase64,
}
