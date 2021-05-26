<script>
  export let data;
</script>

<section>
  <p>
    Posted by: <a href={`https://www.reddit.com/user/${data.author}/`}><strong>u/{data.author}</strong></a> 
    <a class="subreddit" href={`https://www.reddit.com/r/${data.subreddit}/`}>{data.subreddit}</a>
  </p>
  <p>Upvotes: <span><strong>{data.ups}</strong></span></p>
  <h3 class="img-title">{data.title}</h3>
</section>
<div class="img-container">
  <a href={data.postLink}>
    <img src={data.url} alt="Meme" />
  </a>
</div>

<style>
  p {
    margin: 10px;
  }

  a {
    text-decoration: none;
  }

  h3 {
    font-family: Gelasio;
    margin: 10px;
    text-align: center;
  }

  .subreddit {
    background-color: var(--vscode-button-background);
    color: white;
    padding: 0 .5rem;
    border-radius: 10px;
  }
</style>