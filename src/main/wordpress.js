const axios = require('axios')

function basicAuth(username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}

async function testConnection(siteUrl, username, appPassword) {
  try {
    const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/users/me`
    const response = await axios.get(url, {
      headers: { Authorization: basicAuth(username, appPassword) },
      timeout: 10000
    })
    return { success: true, userName: response.data.name || response.data.slug }
  } catch (err) {
    const msg = err.response?.data?.message || err.message
    return { success: false, error: msg }
  }
}

function buildMetaFields(articleData, settings) {
  if (settings.seoPlugin === 'yoast') {
    return {
      _yoast_wpseo_metadesc: articleData.metaDescription,
      _yoast_wpseo_focuskw: articleData.focusKeyword
    }
  }
  if (settings.seoPlugin === 'rankmath') {
    return {
      rank_math_description: articleData.metaDescription,
      rank_math_focus_keyword: articleData.focusKeyword
    }
  }
  return {}
}

async function resolveOrCreateTags(siteUrl, username, appPassword, tagNames) {
  const base = siteUrl.replace(/\/$/, '')
  const tagIds = []

  for (const name of tagNames) {
    try {
      // Search for existing tag
      const searchRes = await axios.get(`${base}/wp-json/wp/v2/tags?search=${encodeURIComponent(name)}`, {
        headers: { Authorization: basicAuth(username, appPassword) },
        timeout: 8000
      })
      const existing = searchRes.data.find(t => t.name.toLowerCase() === name.toLowerCase())
      if (existing) {
        tagIds.push(existing.id)
      } else {
        // Create tag
        const createRes = await axios.post(
          `${base}/wp-json/wp/v2/tags`,
          { name },
          {
            headers: {
              Authorization: basicAuth(username, appPassword),
              'Content-Type': 'application/json'
            },
            timeout: 8000
          }
        )
        tagIds.push(createRes.data.id)
      }
    } catch (e) {
      // Skip tag on error
    }
  }
  return tagIds
}

async function createDraft(siteUrl, username, appPassword, articleData, settings) {
  try {
    const base = siteUrl.replace(/\/$/, '')
    const categoryId = articleData.brand === 'MIS' ? settings.misCategory : settings.wisCategory
    const categories = categoryId ? [parseInt(categoryId)] : []

    const tagIds = await resolveOrCreateTags(base, username, appPassword, articleData.tags || [])
    const meta = buildMetaFields(articleData, settings)

    const body = {
      title: articleData.title,
      content: articleData.contentHTML,
      slug: articleData.slug,
      status: 'draft',
      categories,
      tags: tagIds,
      meta
    }

    const response = await axios.post(`${base}/wp-json/wp/v2/posts`, body, {
      headers: {
        Authorization: basicAuth(username, appPassword),
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })

    const postId = response.data.id
    const draftUrl = `${base}/wp-admin/post.php?post=${postId}&action=edit`
    return { success: true, draftUrl, postId }
  } catch (err) {
    const msg = err.response?.data?.message || err.message
    return { success: false, error: msg }
  }
}

module.exports = { testConnection, createDraft }
