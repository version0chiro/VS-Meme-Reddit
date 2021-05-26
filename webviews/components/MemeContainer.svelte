<script>
  export let data;
</script>

<section>
  <p>Posted by: <span><strong>u/{data.author}</strong></span></p>
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

  h3 {
    font-family: Gelasio;
    margin: 10px;
    text-align: center;
  }
</style>