# Java Regex
*необходимо знать*: [[$ Regex введение]]
*теги*:  #java #регулярка #spring 

---
## Cheap sheet 
![[Pasted image 20210328000120.png]]

## Classes for regex

[[$- class Pattern]] - используется для регулярных выражений. Чтобы воспользоваться, необходимо создать объект с помощью метода Pattern.compile("…"). 

[[$- class Matcher]] - класс для текста, к которому необходимо применить регулярные выражения. Необходимо создать объект с помощью метода matcher("your text"), вызванного у объекта Pattern 

Методы: 
- find() - поиск выражения. Если их несколько, то метод проходится по ним поочередно. 
- start() - возвращает индекс найденного выражения (место в строке).
- group() - возвращает найденное выражение. 

Пример: 
```java
Pattern p = Pattern.compile("a"); 
Matcher m = p.matcher("Jack is a boy"); 
 while(m.find()) { 
            System.out.println(m.start() + " " + m.group() + " "); 
        } 
```
 
Также можно проверить строку на регулярные выражения таким образом: 
```java
System.out.println("abc",matches("[a-b]")); 
```

Экранирование в регулярном выражении осуществляется с помощью символа \, но так как для java этот символ также нужно экранировать, мы ставим \\. Также мы можем экранировать целые блоки выражений, поместив их в \\Q…\\E 

 