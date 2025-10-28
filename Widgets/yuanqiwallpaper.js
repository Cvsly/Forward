var WidgetMetadata = {
  id: "yuanqi.wallpaper",
  title: "元气壁纸",
  description: "基于网页解析的元气壁纸获取工具",
  author: "改造版",
  site: "https://mbizhi.cheetahfun.com/",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "获取壁纸列表",
      description: "根据分类、页码等参数获取壁纸列表",
      requiresWebView: false,
      functionName: "getWallpaperList",
      params: [
        {
          name: "keyword",
          title: "搜索关键词",
          type: "input",
          description: "输入要搜索的壁纸关键词（可选）",
          value: "",
          placeholder: "输入关键词搜索，留空获取全部"
        },
        {
          name: "sortBy",
          title: "壁纸分类",
          type: "input",
          description: "选择壁纸分类",
          value: "all",
          placeholders: [
            { title: "全部", value: "all" },
            { title: "动态壁纸", value: "dynamic" },
            { title: "静态壁纸", value: "static" },
            { title: "4K壁纸", value: "4k" },
            { title: "风景", value: "landscape" },
            { title: "动漫", value: "anime" },
            { title: "美女", value: "beauty" },
            { title: "动物", value: "animal" },
            { title: "游戏", value: "game" },
            { title: "小清新", value: "fresh" },
            { title: "AI", value: "ai" },
            { title: "其他", value: "other" }
          ]
        },
        {
          name: "orientation",
          title: "封面显示方向",
          type: "enumeration",
          description: "封面优先显示方向，默认为横向",
          value: "H",
          enumOptions: [
            {title: "竖向", value: "V"},
            {title: "横向", value: "H"}
          ]
        },
        {
          name: "pg",
          title: "页码",
          type: "page",
          value: "1"
        }
      ]
    }
  ],
};

// 基础URL
const BASE_URL = "https://mbizhi.cheetahfun.com";

/**
 * 构建请求URL
 */
function buildWallpaperUrl(sortBy = "all", page = 1) {
  let url = BASE_URL;
  
  // 根据sortBy构建URL - 基于实际网站结构
  if (sortBy !== "all") {
    const categoryMap = {
      "dynamic": "/dn/d/",      // 动态壁纸
      "static": "/jt/j/",       // 静态壁纸 
      "4k": "/dn/c1d/",         // 4K动态壁纸
      "landscape": "/dn/c3d/",  // 风景动态壁纸
      "anime": "/dn/c2d/",      // 动漫动态壁纸
      "beauty": "/dn/c4d/",     // 美女动态壁纸
      "animal": "/dn/c6d/",     // 动物动态壁纸
      "game": "/dn/c7d/",       // 游戏动态壁纸
      "fresh": "/dn/c8d/",      // 小清新动态壁纸
      "ai": "/dn/c5d/",         // AI动态壁纸
      "other": "/dn/c11d/"      // 其他动态壁纸
    };
    
    if (categoryMap[sortBy]) {
      url += categoryMap[sortBy];
    }
  } else {
    url += "/dn/d/"; // 默认动态壁纸页面
  }
  
  // 添加页码
  if (page > 1) {
    url += `p${page}`;
  }
  
  return url;
}

/**
 * 判断是否为动态壁纸
 * 通过检查特定的角标图标来判断
 */
function isDynamicWallpaper($item, $) {
  // 检查是否包含动态壁纸的角标图标
  const dynamicIcon = $item.find('img[src*="dynamic"], img[alt="动态壁纸"], img[title="动态壁纸"]');
  
  if (dynamicIcon.length > 0) {
    // 排除固定的角标图标
    const iconSrc = dynamicIcon.attr('src') || '';
    if (!iconSrc.includes('dynamic.4397165.png')) {
      console.log("找到动态壁纸角标图标");
      return true;
    }
  }
  
  // 检查class或其他标识
  if ($item.hasClass('dynamic') || $item.find('.dynamic').length > 0) {
    return true;
  }
  
  // 通过链接判断（备用方法）
  const href = $item.find('a').first().attr('href') || $item.attr('href') || '';
  if (href.includes('/dn/pd')) {
    return true;
  }
  
  return false;
}

/**
 * 解析壁纸项目
 */
function parseWallpaperItem(element, $, baseUrl, index) {
  try {
    const $item = $(element);
    
    // 提取链接
    let detailUrl = '';
    
    // 从href属性获取
    detailUrl = $item.attr('href') || '';
    
    // 从子元素a标签获取
    if (!detailUrl) {
      const $link = $item.find('a').first();
      detailUrl = $link.attr('href') || '';
    }
    
    // 从onclick事件中提取
    if (!detailUrl) {
      const onclick = $item.attr('onclick') || '';
      const urlMatch = onclick.match(/['"](\/[^'"]+)['"]/);
      if (urlMatch) {
        detailUrl = urlMatch[1];
      }
    }
    
    // 确保URL完整
    if (detailUrl && !detailUrl.startsWith('http')) {
      detailUrl = baseUrl + detailUrl;
    }
    
    if (!detailUrl) {
      return null;
    }
    
    // 判断是否为动态壁纸
    const isDynamic = isDynamicWallpaper($item, $);
    
    // 提取预览图片，排除角标图标
    let posterPath = '';
    const imgSelectors = [
      'img[src*="thumb"]',
      'img[src*="preview"]',
      'img.lazy',
      'img[data-src]',
      'img[data-original]',
      'img:not([src*="icon"]):not([src*="tag"]):not([src*="dynamic.4397165.png"])',
      'img'
    ];
    
    for (const imgSelector of imgSelectors) {
      const $img = $item.find(imgSelector).first();
      if ($img.length > 0) {
        posterPath = $img.attr('src') || $img.attr('data-src') || $img.attr('data-original') || '';
        
        // 排除角标图标
        if (posterPath && 
            !posterPath.includes('/icon/') && 
            !posterPath.includes('/tag/') && 
            !posterPath.includes('dynamic.4397165.png') &&
            !posterPath.includes('dynamic.png') &&
            !posterPath.includes('static.png') &&
            posterPath.length > 10) {
          break;
        }
        posterPath = '';
      }
    }
    
    if (posterPath && !posterPath.startsWith('http')) {
      posterPath = baseUrl + posterPath;
    }
    
    // 提取标题 - 改进版本，优先使用title属性
    let title = '';
    const titleSources = [
      () => $item.attr('title'),
      () => $item.find('a').first().attr('title'),
      () => $item.find('img').first().attr('title'),
      () => $item.find('img').first().attr('alt'),
      () => $item.find('.title, .name').first().text().trim(),
      () => $item.find('h3, h4, h5').first().text().trim(),
      () => {
        const urlMatch = detailUrl.match(/pd(\d+)\.html/);
        return urlMatch ? `壁纸 ${urlMatch[1]}` : `壁纸 ${index + 1}`;
      }
    ];
    
    for (const getTitle of titleSources) {
      const titleCandidate = getTitle();
      if (titleCandidate && titleCandidate.trim() && titleCandidate.length > 2) {
        title = titleCandidate.trim();
        break;
      }
    }
    
    // 提取分类
    let genreTitle = '';
    if (detailUrl.includes('/dn/c1d/')) genreTitle = '4K';
    else if (detailUrl.includes('/dn/c2d/')) genreTitle = '动漫';
    else if (detailUrl.includes('/dn/c3d/')) genreTitle = '风景';
    else if (detailUrl.includes('/dn/c4d/')) genreTitle = '美女';
    else if (detailUrl.includes('/dn/c5d/')) genreTitle = 'AI';
    else if (detailUrl.includes('/dn/c6d/')) genreTitle = '动物';
    else if (detailUrl.includes('/dn/c7d/')) genreTitle = '游戏';
    else if (detailUrl.includes('/dn/c8d/')) genreTitle = '小清新';
    else if (detailUrl.includes('/dn/c11d/')) genreTitle = '其他';
    else genreTitle = isDynamic ? '动态壁纸' : '静态壁纸';
    
    return {
      id: detailUrl,
      type: "url",
      title: title || `壁纸 ${index + 1}`,
      posterPath: posterPath,
      backdropPath: posterPath, 
      releaseDate: "",
      mediaType: isDynamic ? "tv" : "movie",
      genreTitle: genreTitle,
      description: `${genreTitle} - ${isDynamic ? "动态壁纸" : "静态壁纸"}`,
      link: detailUrl
    };
    
  } catch (error) {
    console.error(`parseWallpaperItem: 解析项目 ${index} 时出错:`, error.message);
    return null;
  }
}

/**
 * 过滤无效结果项
 * 去除那些没有实际内容的分类链接
 */
function filterValidResults(wallpapers) {
  return wallpapers.filter(item => {
    // 过滤掉没有posterPath的项目
    if (!item.posterPath || item.posterPath.trim() === '') {
      console.log(`过滤掉无封面项目: ${item.title}`);
      return false;
    }
    
    // 过滤掉纯分类链接（以/d/、/j/、/c*d/结尾的链接）
    const link = item.link || item.id || '';
    if (link.match(/\/(d|j|c\d*d)\/$/)) {
      console.log(`过滤掉分类链接: ${item.title} - ${link}`);
      return false;
    }
    
    // 过滤掉没有具体壁纸ID的链接（应该包含pd或pj）
    if (!link.includes('/pd') && !link.includes('/pj')) {
      console.log(`过滤掉无效链接: ${item.title} - ${link}`);
      return false;
    }
    
    return true;
  });
}
/**
 * 解析HTML页面中的壁纸信息
 */
function parseWallpaperFromHtml(html, baseUrl = BASE_URL) {
  const wallpapers = [];
  
  try {
    const $ = Widget.html.load(html);
    console.log("parseWallpaperFromHtml: 开始解析HTML内容");
    
    // 查找壁纸项目容器
    const itemSelectors = [
      'a[href*="/dn/pd"], a[href*="/jt/pj"]', // 优先查找具体壁纸链接
      'li',
      '.item', 
      '.wallpaper-item',
      '.pic-item',
      'div[onclick]'
    ];
    
    let $items = $();
    let usedSelector = '';
    
    for (const selector of itemSelectors) {
      $items = $(selector);
      if ($items.length > 0) {
        usedSelector = selector;
        console.log(`parseWallpaperFromHtml: 使用选择器 ${selector} 找到 ${$items.length} 个项目`);
        break;
      }
    }
    
    if ($items.length === 0) {
      console.warn("parseWallpaperFromHtml: 未找到任何壁纸项目");
      return wallpapers;
    }
    
    $items.each((index, element) => {
      if (index >= 50) return false;
      
      const wallpaperItem = parseWallpaperItem(element, $, baseUrl, index);
      if (wallpaperItem) {
        wallpapers.push(wallpaperItem);
        console.log(`parseWallpaperFromHtml: 成功解析项目 ${index + 1}: ${wallpaperItem.title} (${wallpaperItem.mediaType === 'tv' ? '动态' : '静态'})`);
      }
    });
    
    // 过滤无效结果
    const validWallpapers = filterValidResults(wallpapers);
    console.log(`parseWallpaperFromHtml: 过滤后剩余 ${validWallpapers.length} 个有效壁纸项目`);
    
    return validWallpapers;
    
  } catch (error) {
    console.error("parseWallpaperFromHtml: 解析HTML时出错:", error.message);
  }
  
  return [];
}

/**
 * 获取壁纸列表
 */
async function getWallpaperList(params = {}) {
  const keyword = params.keyword || "";
  const sortBy = params.sortBy || "all";
  const orientation = params.orientation || "H";
  const page = parseInt(params.pg) || 1;
  
  if (page < 1) {
    throw new Error("页码必须大于0");
  }
  
  console.log(`getWallpaperList: 封面显示方向=${orientation}`);
  
  // 如果有关键词，使用搜索功能
  if (keyword.trim()) {
    console.log(`getWallpaperList: 使用关键词搜索: ${keyword}`);
    return await searchWallpaper({ wd: keyword, pg: page, orientation });
  }
  
  const requestUrl = buildWallpaperUrl(sortBy, page);
  console.log(`getWallpaperList: 请求壁纸页面: ${requestUrl}`);
  console.log(`getWallpaperList: 分类=${sortBy}, 页码=${page}`);
  
  try {
    const response = await Widget.http.get(requestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': BASE_URL
      }
    });
    
    if (!response || !response.data) {
      console.error("getWallpaperList: API请求失败，未收到任何数据。URL:", requestUrl);
      throw new Error("API请求失败: 未收到任何数据。");
    }
    
    console.log(`getWallpaperList: 页面内容长度: ${response.data.length} 字符`);
    
    const resultList = parseWallpaperFromHtml(response.data, BASE_URL);
    
    // 根据方向参数调整封面显示
    if (orientation === "H") {
      resultList.forEach(item => {
        // 对于横向显示，可以在这里添加特定的处理逻辑
        // 比如调整图片尺寸参数等
        console.log(`应用横向显示设置: ${item.title}`);
      });
    }
    
    if (resultList && Array.isArray(resultList)) {
      console.log(`getWallpaperList: 成功解析 ${resultList.length} 个壁纸项目。`);
      return resultList;
    } else {
      console.warn("getWallpaperList: 解析返回的壁纸列表为空或格式不正确。");
      return [];
    }
    
  } catch (error) {
    console.error(`getWallpaperList: 获取壁纸列表时发生错误 (${requestUrl}):`, error.message);
    throw new Error(`获取壁纸列表失败: ${error.message}.`);
  }
}

/**
 * 生成搜索页面的hash值
 * 基于实际网站的搜索URL格式
 */
function generateSearchHash(keyword) {
  // 这里需要模拟网站的hash生成逻辑
  // 从URL看是一个固定的hash: 45a6bf9df5026fa77d33f77ef19f2a9e
  // 可能需要通过分析网站的JS来获取正确的hash生成方法
  return "45a6bf9df5026fa77d33f77ef19f2a9e";
}

/**
 * 构建搜索URL
 * 基于实际的搜索URL格式
 */
function buildSearchUrl(keyword, page = 1) {
  const hash = generateSearchHash(keyword);
  const encodedKeyword = encodeURIComponent(keyword);
  return `${BASE_URL}/search_${hash}.html?search=${encodedKeyword}&page=${page}`;
}

/**
 * 尝试从首页获取搜索表单信息
 */
async function getSearchFormInfo() {
  try {
    console.log("getSearchFormInfo: 尝试获取搜索表单信息");
    const response = await Widget.http.get(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': BASE_URL
      }
    });
    
    if (response && response.data) {
      const $ = Widget.html.load(response.data);
      
      // 查找搜索表单
      const searchForm = $('form[action*="search"], input[name*="search"]').closest('form');
      if (searchForm.length > 0) {
        const action = searchForm.attr('action') || '';
        console.log("找到搜索表单action:", action);
        return action;
      }
      
      // 查找搜索相关的JavaScript
      const scripts = $('script').toArray();
      for (let script of scripts) {
        const scriptContent = $(script).html() || '';
        if (scriptContent.includes('search') && scriptContent.includes('function')) {
          console.log("找到搜索相关脚本");
          // 这里可能需要进一步解析JavaScript来获取搜索逻辑
        }
      }
    }
  } catch (error) {
    console.warn("getSearchFormInfo: 获取搜索表单信息失败:", error.message);
  }
  
  return null;
}
/**
 * 搜索壁纸 - 改进版本
 */
async function searchWallpaper(params = {}) {
  const keyword = params.wd || "";
  const orientation = params.orientation || "H";
  const page = parseInt(params.pg) || 1;
  
  if (!keyword.trim()) {
    throw new Error("搜索关键词不能为空");
  }
  
  console.log(`searchWallpaper: 搜索关键词: ${keyword}, 页码: ${page}, 方向: ${orientation}`);
  
  try {
    // 方法1: 使用观察到的搜索URL格式
    const searchUrl = buildSearchUrl(keyword, page);
    console.log(`searchWallpaper: 尝试搜索URL: ${searchUrl}`);
    
    let response = await Widget.http.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': BASE_URL
      }
    });
    
    if (response && response.data && response.data.length > 1000) {
      const searchResults = parseWallpaperFromHtml(response.data, BASE_URL);
      if (searchResults.length > 0) {
        console.log(`searchWallpaper: 直接搜索成功，找到 ${searchResults.length} 个结果`);
        
        // 根据方向参数调整封面显示
        if (orientation === "H") {
          searchResults.forEach(item => {
            console.log(`应用横向显示设置: ${item.title}`);
          });
        }
        
        return searchResults;
      }
    }
    
    // 方法2: 尝试POST搜索
    console.log("searchWallpaper: 尝试POST搜索");
    response = await Widget.http.post(`${BASE_URL}/search.php`, {
      data: {
        search: keyword,
        page: page
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': BASE_URL
      }
    });
    
    if (response && response.data && response.data.length > 1000) {
      const searchResults = parseWallpaperFromHtml(response.data, BASE_URL);
      if (searchResults.length > 0) {
        console.log(`searchWallpaper: POST搜索成功，找到 ${searchResults.length} 个结果`);
        
        if (orientation === "H") {
          searchResults.forEach(item => {
            console.log(`应用横向显示设置: ${item.title}`);
          });
        }
        
        return searchResults;
      }
    }
    
    // 方法3: 尝试其他可能的搜索URL格式
    const altSearchUrls = [
      `${BASE_URL}/search?keyword=${encodeURIComponent(keyword)}&page=${page}`,
      `${BASE_URL}/search?q=${encodeURIComponent(keyword)}&p=${page}`,
      `${BASE_URL}/s?wd=${encodeURIComponent(keyword)}&page=${page}`
    ];
    
    for (const altUrl of altSearchUrls) {
      try {
        console.log(`searchWallpaper: 尝试备用搜索URL: ${altUrl}`);
        
        response = await Widget.http.get(altUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': BASE_URL
          }
        });
        
        if (response && response.data && response.data.length > 1000) {
          const searchResults = parseWallpaperFromHtml(response.data, BASE_URL);
          if (searchResults.length > 0) {
            console.log(`searchWallpaper: 备用搜索成功，找到 ${searchResults.length} 个结果`);
            
            if (orientation === "H") {
              searchResults.forEach(item => {
                console.log(`应用横向显示设置: ${item.title}`);
              });
            }
            
            return searchResults;
          }
        }
      } catch (error) {
        console.warn(`searchWallpaper: 备用搜索URL失败 ${altUrl}:`, error.message);
        continue;
      }
    }
    
    // 方法4: 备用搜索方案 - 从分类页面筛选
    console.log("searchWallpaper: 使用分类筛选备用搜索方案");
    return await fallbackSearch(keyword, page);
    
  } catch (error) {
    console.error(`searchWallpaper: 搜索壁纸时发生错误:`, error.message);
    
    // 最后的备用方案
    console.log("searchWallpaper: 使用最终备用搜索方案");
    return await fallbackSearch(keyword, page);
  }
}

/**
 * 改进的备用搜索方案
 * 从多个分类页面获取内容并进行关键词匹配
 */
async function fallbackSearch(keyword, page = 1) {
  console.log(`fallbackSearch: 使用改进备用搜索方案查找: ${keyword}`);
  
  const categories = ["dynamic", "anime", "landscape", "4k", "beauty", "game", "fresh", "ai"];
  let allResults = [];
  
  try {
    // 并发获取多个分类的内容
    const searchTasks = categories.map(async (sortBy) => {
      try {
        console.log(`fallbackSearch: 搜索分类 ${sortBy}`);
        const results = await getWallpaperList({ sortBy, pg: 1 });
        
        // 更宽松的关键词匹配
        const matched = results.filter(item => {
          const searchableText = [
            item.title || '',
            item.description || '',
            item.genreTitle || ''
          ].join(' ').toLowerCase();
          
          const keywordLower = keyword.toLowerCase();
          
          // 支持中文分词匹配
          const keywordChars = keywordLower.split('');
          const hasAllChars = keywordChars.every(char => searchableText.includes(char));
          
          return searchableText.includes(keywordLower) || 
                 hasAllChars ||
                 searchableText.includes(keywordLower.replace(/\s+/g, ''));
        });
        
        console.log(`fallbackSearch: 分类 ${sortBy} 找到 ${matched.length} 个匹配项`);
        return matched;
        
      } catch (error) {
        console.warn(`fallbackSearch: 分类 ${sortBy} 搜索失败:`, error.message);
        return [];
      }
    });
    
    const results = await Promise.all(searchTasks);
    results.forEach(categoryResults => {
      allResults = allResults.concat(categoryResults);
    });
    
    // 去重并按相关性排序
    const uniqueResults = [];
    const seenIds = new Set();
    
    allResults.forEach(item => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        
        // 计算相关性分数
        const title = (item.title || '').toLowerCase();
        const keywordLower = keyword.toLowerCase();
        
        let relevanceScore = 0;
        if (title.includes(keywordLower)) relevanceScore += 10;
        if (title.startsWith(keywordLower)) relevanceScore += 5;
        
        item.relevanceScore = relevanceScore;
        uniqueResults.push(item);
      }
    });
    
    // 按相关性排序
    uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    console.log(`fallbackSearch: 备用搜索找到 ${uniqueResults.length} 个相关结果`);
    
    // 分页处理
    const pageSize = 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return uniqueResults.slice(startIndex, endIndex);
    
  } catch (error) {
    console.error("fallbackSearch: 备用搜索失败:", error.message);
    return [];
  }
}

/**
 * 加载详情
 */
async function loadDetail(detailPageUrl) {
  if (!detailPageUrl || typeof detailPageUrl !== "string") {
    console.error("loadDetail: 无效的 detailPageUrl 参数:", detailPageUrl);
    throw new Error("无效的参数：detailPageUrl 不能为空。");
  }
  
  console.log(`loadDetail: 请求壁纸详情: ${detailPageUrl}`);
  
  try {
    const response = await Widget.http.get(detailPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': BASE_URL
      }
    });
    
    if (!response || !response.data) {
      const errorMsg = "未收到任何数据";
      console.error("loadDetail: 详情请求失败:", errorMsg);
      throw new Error(`详情请求失败: ${errorMsg}`);
    }
    
    const wallpaperDetail = parseWallpaperDetail(response.data, detailPageUrl);
    
    console.log("loadDetail returning object:", wallpaperDetail);
    return wallpaperDetail;
    
  } catch (error) {
    console.error(`loadDetail: 加载壁纸详情时发生错误 (URL: ${detailPageUrl}):`, error.message);
    throw new Error(`加载壁纸详情失败: ${error.message}.`);
  }
}

/**
 * 解析壁纸详情页面
 * 重点提取视频链接和静态封面
 */
function parseWallpaperDetail(html, detailPageUrl) {
  try {
    const $ = Widget.html.load(html);
    console.log("parseWallpaperDetail: 开始解析详情页面");
    
    // 基础返回对象
    let returnObject = {
      id: detailPageUrl,
      type: "url",
      title: "壁纸详情",
      description: "",
      posterPath: "",
      backdropPath: "",
      releaseDate: "",
      genreTitle: "",
      videoUrl: null,
      link: detailPageUrl,
      mediaType: "movie"
    };
    
    // 提取标题
    let title = '';
    const titleSources = [
      () => $('title').text(),
      () => $('h1').first().text(),
      () => $('.title, .name, .wallpaper-title').first().text()
    ];
    
    for (const getTitle of titleSources) {
      const titleCandidate = getTitle();
      if (titleCandidate && titleCandidate.trim()) {
        title = titleCandidate.replace(/\s*-\s*元气壁纸.*$/i, '').trim();
        if (title.length > 2) break;
      }
    }
    
    if (title) {
      returnObject.title = title;
    }
    
    // 提取描述
    const description = $('meta[name="description"]').attr('content') || 
                       $('.description, .desc, .content').first().text().trim();
    if (description) {
      returnObject.description = description;
    }
    
    // 查找视频元素 - 重点改进部分
    const $video = $('video#myVideo').first();
    if ($video.length > 0) {
      // 提取视频src
      const videoSrc = $video.attr('src');
      if (videoSrc) {
        let videoUrl = videoSrc;
        if (!videoUrl.startsWith('http')) {
          videoUrl = BASE_URL + videoUrl;
        }
        returnObject.videoUrl = videoUrl;
        returnObject.mediaType = "tv"; // 动态壁纸
        console.log("parseWallpaperDetail: 找到视频链接:", videoUrl);
      }
      
      // 提取静态封面poster
      const posterSrc = $video.attr('poster');
      if (posterSrc) {
        let posterUrl = posterSrc;
        if (!posterUrl.startsWith('http')) {
          posterUrl = BASE_URL + posterUrl;
        }
        returnObject.posterPath = posterUrl;
        returnObject.backdropPath = posterUrl;
        console.log("parseWallpaperDetail: 找到静态封面:", posterUrl);
      }
    }
    
    // 如果没有找到video元素，尝试其他方式查找视频链接
    if (!returnObject.videoUrl) {
      const videoSelectors = [
        'video source[src]',
        'video[src]',
        'source[src*=".mp4"]',
        'a[href*=".mp4"]',
        '.download-btn[href*=".mp4"]'
      ];
      
      for (const selector of videoSelectors) {
        const $videoElement = $(selector).first();
        if ($videoElement.length > 0) {
          let videoUrl = $videoElement.attr('src') || $videoElement.attr('href') || '';
          if (videoUrl) {
            if (!videoUrl.startsWith('http')) {
              videoUrl = BASE_URL + videoUrl;
            }
            returnObject.videoUrl = videoUrl;
            returnObject.mediaType = "tv"; // 动态壁纸
            console.log("parseWallpaperDetail: 找到视频链接:", videoUrl);
            break;
          }
        }
      }
    }
    
    // 如果没有找到静态封面，查找其他图片
    if (!returnObject.posterPath) {
      const imageSelectors = [
        'img[src*="hd"]',
        'img[src*="large"]',
        '.wallpaper-image img[src]',
        '.detail-image img[src]',
        'img[src]:not([src*="icon"]):not([src*="tag"]):not([src*="dynamic.4397165.png"])',
        'img[src]'
      ];
      
      for (const selector of imageSelectors) {
        const $img = $(selector).first();
        if ($img.length > 0) {
          let imageUrl = $img.attr('src') || '';
          
          if (imageUrl && 
              !imageUrl.includes('/icon/') && 
              !imageUrl.includes('/tag/') && 
              !imageUrl.includes('dynamic.4397165.png') &&
              imageUrl.length > 10) {
            
            if (!imageUrl.startsWith('http')) {
              imageUrl = BASE_URL + imageUrl;
            }
            
            returnObject.posterPath = imageUrl;
            returnObject.backdropPath = imageUrl;
            console.log("parseWallpaperDetail: 找到图片链接:", imageUrl);
            break;
          }
        }
      }
    }
    
    // 设置分类
    if (detailPageUrl.includes('/dn/c1d/')) returnObject.genreTitle = '4K动态壁纸';
    else if (detailPageUrl.includes('/dn/c2d/')) returnObject.genreTitle = '动漫动态壁纸';
    else if (detailPageUrl.includes('/dn/c3d/')) returnObject.genreTitle = '风景动态壁纸';
    else if (detailPageUrl.includes('/dn/c4d/')) returnObject.genreTitle = '美女动态壁纸';
    else if (detailPageUrl.includes('/dn/c5d/')) returnObject.genreTitle = 'AI动态壁纸';
    else if (detailPageUrl.includes('/dn/c6d/')) returnObject.genreTitle = '动物动态壁纸';
    else if (detailPageUrl.includes('/dn/c7d/')) returnObject.genreTitle = '游戏动态壁纸';
    else if (detailPageUrl.includes('/dn/c8d/')) returnObject.genreTitle = '小清新动态壁纸';
    else if (detailPageUrl.includes('/dn/c11d/')) returnObject.genreTitle = '其他动态壁纸';
    else if (detailPageUrl.includes('/jt/')) returnObject.genreTitle = '静态壁纸';
    else returnObject.genreTitle = returnObject.videoUrl ? '动态壁纸' : '静态壁纸';
    
    return returnObject;
    
  } catch (error) {
    console.error("parseWallpaperDetail: 解析详情时出错:", error.message);
    
    // 返回基础对象，避免完全失败
    return {
      id: detailPageUrl,
      type: "url",
      title: "壁纸详情",
      description: "解析失败",
      posterPath: "",
      backdropPath: "",
      releaseDate: "",
      genreTitle: "壁纸",
      videoUrl: null,
      link: detailPageUrl,
      mediaType: "movie"
    };
  }
}
