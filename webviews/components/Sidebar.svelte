<script lang="ts">
  import { onMount } from "svelte";

  let flag = false;
  let temp:Promise<string> = null;
  class Meme {
    url: string;
    title: string;

    constructor(url: string, title: string) {
      this.url = url;
      this.title = title;
    }
  }

  class MemeService {
    async getMemes(): Promise<Meme[]> {
      const response = await fetch("https://meme-api.herokuapp.com/gimme");

      return await response.json();
    }
  }

  let apiClient = new MemeService();
  // apiClient.getMemes().then((memes) => console.log(memes));
  const fetchImage = async () => {
    const response = await fetch("https://meme-api.herokuapp.com/gimme");

    return await response.json();
  };

  $: memeFetch = fetchImage;
</script>

<div>
  {#await memeFetch()}
    <p>Getting you top quality Meme!</p>
  {:then data}
    <p>Here it is!</p>
    {#if flag}
      <img src={temp.url} alt="Meme" />
      <h3>{temp.title}</h3>
    {:else}
      <img src={data.url} alt="Meme" />
      <h3>{data.title}</h3>
    {/if}

  {:catch}
    <p class="para">Something went wrong!</p>
  {/await}
</div>

<button
  on:click={() =>
    apiClient.getMemes().then((memes) => {
      console.log(memes.url);
      temp = memes;
      flag = true;
      // console.log(temp);
    })}>foo</button
>

<!-- svelte-ignore missing-declaration -->
<style>
  @font-face {
    font-family: "Gelasio";
    font-style: normal;
    font-weight: 400;
    src: local("Gelasio Regular"), local("Gelasio-Regular"),
      url(https://fonts.gstatic.com/s/gelasio/v1/cIf9MaFfvUQxTTqS9C6hYQ.woff2)
        format("woff2");
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
  }
  div {
    padding:10px;
    text-align: center;
  }
  img{
    border:1px solid;
    border-color: aquamarine;
    width:200%;
    height:200%;
  }
  p{
    margin:10px;
  }

  h3 {
    font-family: Gelasio;
  }
</style>
