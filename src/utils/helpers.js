    function generateSlug(title) {
      if (!title) return '';
      let slug = title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes
      return slug;
    }
    
    export { generateSlug };
  