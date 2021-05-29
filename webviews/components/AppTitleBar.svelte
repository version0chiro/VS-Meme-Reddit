<script>
  export let data = {};
</script>

<section class="app-title-bar">
  <p>
    Posted by: <a href={`https://www.reddit.com/user/${data.author}/`}
      ><strong>u/{data.author}</strong></a
    >
    <a class="subreddit" href={`https://www.reddit.com/r/${data.subreddit}/`}
      >{data.subreddit}</a
    >
  </p>
  <p>Upvotes: <span><strong>{data.ups}</strong></span></p>
</section>

<style>
  .app-title-bar {
    width: 100%;
    position: absolute;
    top: 1vh;
    text-align: center;
  }
  p {
    margin: 10px;
  }

  a {
    text-decoration: none;
  }

  
  .subreddit {
    background-color: var(--vscode-button-background);
    color: white;
    padding: 0 0.5rem;
    border-radius: 10px;
  }
</style>
