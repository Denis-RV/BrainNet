# Inversion of Control (loC)
*Need to know:* [[Intro to Spring]]
*status:* In process
*format:* stage
*tegs:* #programming #spring #java 

---
## Проблемы зависимостей

- **Сильная зависимость**. Класс MusicPlayer сильно зависит от ClfssicalMuxic. Класс MusicPlayer заточен на работу только с classiczlMusic.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%201.png](Images/Programming/Spring%20Framework/Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%201.png)

	**Решение:** Использовать интерфейс (абстрактный класс), который бы обобщал различные музыкальные жанры.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%202.png](Images/Programming/Spring%20Framework/Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%202.png)

---

- **Обекты создаются вручную.** Мы хотим вынести эти детали в конфигурационный файл, а не лезть каждый раз в код для того, чтобы поменять объект.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%203.png](Images/Programming/Spring%20Framework/Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%203.png)

	**Решение:** Использовать Spring Framework, который сам создает объекты (бины) согласно конфигурационному файлу.

---

- **MusicPlayer сам создает свои зависимости.** Это архитектурно неправильно.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%204.png](Images/Programming/Spring%20Framework/Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%204.png)

	**Решение:** Использовать принцып LoC

---

- **Создание объекта.** Объект, который мы хотим внедрить в MusicPlayer необходимо где-то создавать.

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%205.png](Images/Programming/Spring%20Framework/Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%205.png)

	![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%206.png](Untitled%206.png)

	**Решение:** проблема решается с помощью [$ Dependency Injection]($%20Dependency%20Injection.md) 

---
## Пример Inversion of Control


![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%207.png](Untitled%207.png)

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%208.png](Untitled%208.png)

1. MusicPlayer зависит от СlassicalMusic
2. MusicPlayer сам создает объект ClassicalMusic
3. Вместо этого мы хотим передавать объект ClassicalMusic внуть MusicPlayer - это и называется инверсией управления.

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%209.png](Untitled%209.png)

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%2010.png](Untitled%2010.png)

## Spring Container (Application Context)
==Spring Container== создает и управляет объектами. В нем они создаются и от туда извлекаются. Этот контейнер читает конфиг-файлы.

Основные функции Spring Container:
- IoC - Инверсия управления. Создание и управление объектами.
- Dependency Injection - внедрение зависимостей. DI делает объекты нашего приложения слабо зависимыми друг от друга.

IoC - аутсорсинг создания и управления объектами, т.к. передача программистом прав на создание и управление объектами Spring-y.

***Spring можно конфигурировать с помощью:***

- XML файла конфигурации (старый способ, но многие приложения до сих пор его испоьзуют).
	```xml
	<bean id = "mePet"
		  class = "intro.Cat">
	</bean>
	```
	id - идентификатор бина, class - полное имя бина. ==Spring Bean== - это объект, который создается и управляется Spring Container.
	```java
	public static void main(String\[\] args) {  
   ClassPathXmlApplicationContext context =  
         new ClassPathXmlApplicationContext("applicationContext.xml");  
 	Pet pet = context.getBean("myPet", Pet.class);  
 	pet.say();  
 	 
 	context.close();  
	}
	```
	
- Java аннотаций и немного XML (современный способ).
- Вся конфигурация на Java (современный способ).
---
### See next:
- [[$ Dependency Injection]]
- [[$ Bean]]