<script lang="ts">
  import Buttons from "./Buttons.svelte";
  import Footer from "./Footer.svelte";
  import AppTitleBar from "./AppTitleBar.svelte";
  import ImgContainer from "./ImgContainer.svelte";
  import { onMount } from "svelte";

  let imgData: {
    url: string;
    title: string;
    author: string;
    ups: number;
    postLink: string;
    subreddit: string;
  }; // holds the current image info.

  // local store to hold visited memes
  let visitedMemes: {
    url: string;
    title: string;
    author: string;
    ups: number;
    postLink: string;
    subreddit: string;
  }[] = [];

  let loading = false; // to show image or loading text...

  // API call and state updation..
  const fetchImgFromAPI = async () => {
    const imgElement = <HTMLImageElement>document.querySelector(".img-meme");
    // check if image is rendered or not...
    if (imgElement && imgElement.complete && imgElement.naturalHeight !== 0) {
      // update the array with unique entries.
      if (!visitedMemes.find((m) => m.url === imgData.url)) {
        visitedMemes.push({
          url: imgData.url,
          title: imgData.title,
          author: imgData.author,
          ups: imgData.ups,
          postLink: imgData.postLink,
          subreddit: imgData.subreddit,
        });
      }
    }
    loading = true;
    // call api and up on resolving the promise fill the data and reset the flag to load
    await fetch("https://meme-api.herokuapp.com/gimme")
      .then((res) => res.json())
      .then((imgDetails) => {
        imgData = imgDetails;
        loading = false;
      });
  };

  // upon first app load, call api to fetch an image.
  onMount(fetchImgFromAPI);

  const fetchNextImg = () => {
    // call api and update state
    fetchImgFromAPI();
    // enable prev button since atleast one item to show
    let prevBtn = <HTMLButtonElement>(
      document.querySelector(".prev-btn-disabled")
    );
    if (prevBtn) {
      prevBtn.disabled = false;
      prevBtn.classList.remove("prev-btn-disabled");
    }
  };
  // Previous button click...
  const fetchPreviousImg = () => {
    if (visitedMemes.length < 1) {
      let prevBtn = <HTMLButtonElement>document.querySelector(".btn-prev");
      if (prevBtn) {
        prevBtn.classList.add("prev-btn-disabled");
        prevBtn.disabled = true;
      }
      return;
    }
    imgData = visitedMemes.pop()!;
  };
</script>

<AppTitleBar data={imgData} />
<main>
  {#if loading}
    <p>hold on buddy... getting you an awesome meme...</p>{:else}
    <ImgContainer data={imgData} />
  {/if}
</main>
<Buttons on:onClickNext={fetchNextImg} on:onClickPrevious={fetchPreviousImg} />
<Footer />

<!-- svelte-ignore missing-declaration -->
<style>
  main {
    position: absolute;
    top: 10vh;
    text-align: center;
    max-width: 100%;
    padding: 10px;
  }
</style>
