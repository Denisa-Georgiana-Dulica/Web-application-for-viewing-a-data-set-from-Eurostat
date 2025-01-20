# 💻 Web application for viewing a data set from Eurostat

💥 The dataset contains information on GDP per capita, Life Expectancy, and Population indicators for European Union countries from 2009 to 2023.

💥 Features:
- Automatic retrieval at application startup of current data on GDP per capita / Life Expectancy / Population for EU countries for the last 15 years available and processing to bring the JSON file form from the media directory.
- Graphic display of the evolution for an indicator from a country (the user chooses the indicator and the country), an SVG element is used, the graph type - histogram
- For the histogram to display a tooltip that displays the year and value for the chosen indicator and the period corresponding to the mouse position
- Display a bubble chart for a year selected by the user using a canvas element (the size of the circle increases with the GDP value, the circles positioned at the top of the graph represent the countries with the higher population value and vice versa, and the vertical position is proportional to the value population of each country).
- Displaying a bubble chart for a year selected by the user using a canvas-type element and making an animation in which the size of the circle increases with the value of the GDP, the circles positioned at the top of the chart represent the countries with the higher population value and vice versa, the position vertical is proportional to the population value of each country.
- Display a table of available data for a year selected by the user (countries on the lines and the three indicators on the column) and each cell will be given a color (from red to green) according to its distance from the union average.

![image](https://github.com/user-attachments/assets/c6e7aa10-ed11-45ec-bb00-d048002e57a4)

![image](https://github.com/user-attachments/assets/17fa0fdd-c097-49d1-9ea5-823376881d6c)

![image](https://github.com/user-attachments/assets/c7bbc244-dbcc-45e3-8b49-8517a59dca0c)

The datasets used are:
-  sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB for PIB
-  demo_mlexpec?sex=T&age=Y1 for Life Expectancy
-  demo_pjan?sex=T&age=TOTAL for Population
  
