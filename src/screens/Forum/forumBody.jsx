import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import RenderHTML, { defaultHTMLElementModels } from 'react-native-render-html';
import { decode } from 'html-entities';
import truncate from 'html-truncate'; 

// ========== Clean inline styles ==========
const stripInlineStyles = (domNode) => {
  if (domNode.attribs?.style) {
    domNode.attribs.style = domNode.attribs.style
      .split(';')
      .map((s) => s.trim())
      .filter((s) => {
        const lower = s.toLowerCase();
        return (
          lower.startsWith('font-weight') ||
          lower.startsWith('font-style') ||
          lower.startsWith('text-align') ||
          lower.startsWith('color')
        );
      })
      .join('; ');

    if (!domNode.attribs.style.trim()) {
      delete domNode.attribs.style;
    }
  }
};

// ========== Shared styling ==========
const baseStyle = { fontSize: 15 };

const defaultTextProps = {
  selectable: true,
  style: {
    fontSize: 15,
    marginTop: 0,
    marginBottom: 0,
    // fontWeight: '400',
    // lineHeight: 20,

  },
};

const tagStyles = {
  p: { marginTop: 0, marginBottom: 5 },
  'li > p': { marginTop: 0, marginBottom: 0 },
  div: { marginTop: 0, marginBottom: 0 },
  br: { marginBottom: 10 },
  ul: { marginTop: 0, marginBottom: 0 },
  ol: { marginTop: 0, marginBottom: 0 },
  li: { marginTop: 0, marginBottom: 0 },
  span: { marginTop: 0, marginBottom: 0 },
  h1: { marginTop: 0, marginBottom: 0 },
  h2: { marginTop: 0, marginBottom: 0 },
  h3: { marginTop: 0, marginBottom: 0 },
  h4: { marginTop: 0, marginBottom: 0 },
  h5: { marginTop: 0, marginBottom: 0 },
  h6: { marginTop: 0, marginBottom: 0 },
  b: { fontWeight: 'bold' },
  strong: { fontWeight: 'bold' },

};

// ========== RenderHTML Wrapper (memoized) ==========
const RenderHtmlRenderer = React.memo(({ sourceHtml, width }) => {
  const memoSource = useMemo(() => ({ html: sourceHtml }), [sourceHtml]);

  return (
    <RenderHTML
      contentWidth={width}
      source={memoSource}
      emSize={14}
      ignoredStyles={[]}
      baseStyle={baseStyle}
      tagsStyles={tagStyles}
      defaultTextProps={defaultTextProps}
      ignoredDomTags={['font']}
      customHTMLElementModels={defaultHTMLElementModels}
      domVisitors={{
        onElement: (domNode) => {
          stripInlineStyles(domNode);
        },
      }}
    />
  );
});

// ========== ForumBody Component ==========
export const ForumBody = ({ html = '' }) => {
  const { width } = useWindowDimensions();
  const MAX_CHARS = 200;
  const [isExpanded, setIsExpanded] = useState(false);

  const plainText = useMemo(() => {
    const stripped = html
      ?.replace(/<\/(p|div|br|h[1-6]|li)>/gi, ' ')
      .replace(/<[^>]+>/g, '') || '';
    return decode(stripped.trim());
  }, [html]);

  const showReadMore = plainText.length > MAX_CHARS;

  const collapsedHtml = useMemo(() => {
    if (!showReadMore || isExpanded) return html;
  
    const truncated = truncate(html, MAX_CHARS, {
      ellipsis: '... <span style="color: #999">Read more</span>',
    });
  
    return `<p>${truncated}</p>`;
  }, [html, isExpanded, showReadMore]);
  

  const handleExpand = () => {
    if (!isExpanded) setIsExpanded(true);
  };

  return (
    <TouchableOpacity
      onPress={showReadMore && !isExpanded ? handleExpand : undefined}
      activeOpacity={showReadMore && !isExpanded ? 0.9 : 1}
      style={{ marginTop: 5 }}
    >
      <View>
        <RenderHtmlRenderer sourceHtml={collapsedHtml} width={width} />
      </View>
    </TouchableOpacity>
  );
};


export const ForumPostBody = ({ html, forumId, numberOfLines }) => {
  const plainText = useMemo(() => {
    const stripped = html
      ?.replace(/<\/(p|div|br|h[1-6]|li)>/gi, ' ') // replace closing tags with space
      .replace(/<[^>]+>/g, '') || '';

    return decode(stripped.trim());
  }, [html]);

  return (
    <View style={{ paddingHorizontal: 10, marginTop: 5 }}>
      <Text
        {...(numberOfLines ? {
          numberOfLines,
          ellipsizeMode: 'tail',
        } : {})}
        style={{
          fontSize: 14,
          color: '#333',
          fontWeight: '600',
          lineHeight: 20,
        }}
      >
        {plainText}
      </Text>
    </View>
  );
};


export const MyPostBody = ({ html, forumId, numberOfLines }) => {
  const plainText = useMemo(() => {
    const stripped = html
      ?.replace(/<\/(p|div|br|h[1-6]|li)>/gi, ' ') // replace closing tags with space
      .replace(/<[^>]+>/g, '') || '';

    return decode(stripped.trim());
  }, [html]);

  return (
    <View style={{ marginTop: 5 }}>
      <Text
        {...(numberOfLines ? {
          numberOfLines,
          ellipsizeMode: 'tail',
        } : {})}
        style={{
          fontSize: 14,
          color: '#000',
          fontWeight: '400',
          // lineHeight: 20,
        }}
      >
        {plainText}
      </Text>
    </View>
  );
};


export const cleanForumHtml = (html) => {
  if (!html) return '';

  html = cleanTooltips(html);

  return html
    // Remove color and background-color inline styles but keep others
    .replace(/style="[^"]*(color|background-color):[^";]*;?[^"]*"/gi, (match) => {
      return match
        .replace(/(?:color|background-color):[^";]*;?/gi, '')
        .replace(/style="\s*"/gi, '');
    })
    // Keep only allowed inline styles
    .replace(/style="([^"]*)"/gi, (match, styleContent) => {
      const allowed = styleContent
        .split(';')
        .map(s => s.trim())
        .filter(s =>
          s.startsWith('font-weight') ||
          s.startsWith('font-style') ||
          s.startsWith('text-align')
        );
      return allowed.length ? `style="${allowed.join('; ')}"` : '';
    })
    // Remove empty style=""
    .replace(/\sstyle="\s*"/gi, '')
    // Sanitize anchor tags
    .replace(/<a [^>]*href="([^"]+)"[^>]*>/gi, '<a href="$1">')
    // DO NOT remove empty b/strong/i/em/u/span tags
    // Old line (removed): .replace(/<[^\/>][^>]*>\s*<\/[^>]+>/gi, '')
};

export const cleanTooltips = (html) => {
  return html
    .replace(/aria-[\w-]+="[^"]*"/gi, '')
    .replace(/<abbr[^>]*>.*?<\/abbr>/gi, '')
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/\b([A-Za-z]+)\b\s+\1\b/gi, '$1')
    .replace(/Tooltip:?\s+[^<\n]+/gi, '');
};

export const normalizeHtml = (input = '', query = '') => {
  if (!input?.trim()) return '';

  const decoded = decode(input);
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(decoded);

  // Function to escape special regex characters in query
  const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Highlighting logic
  const highlightQuery = (text, q) => {
    if (!q) return text;
    const regex = new RegExp(escapeRegExp(q), 'gi');
    return text.replace(regex, match => `<mark style="background-color: yellow">${match}</mark>`);
  };

  if (isHtml) {
    return highlightQuery(decoded, query);
  } else {
    const htmlWrapped = decoded
      .trim()
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => `<p>${highlightQuery(line, query)}</p>`)
      .join('');
    return htmlWrapped;
  }
};


export const generateHighlightedHTML = (rawHtml = '', query = '') => {
  if (!query?.trim()) return normalizeHtml(rawHtml);

  const safeQuery = query.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
  const regex = new RegExp(`(${safeQuery})`, 'gi');

  let html = normalizeHtml(rawHtml);

  // Split by tags to avoid replacing inside HTML tags
  return html.replace(/(<[^>]+>)|([^<]+)/g, (match, tag, text) => {
    if (tag) return tag; // keep tags unchanged
    return text.replace(regex, (match) =>
      `<span style="background-color: #fff9c4; border-radius: 4px; padding: 0 2px;">${match}</span>`
    );
  });
};

