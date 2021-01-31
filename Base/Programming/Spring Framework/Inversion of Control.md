# Inversion of Control (loC)

Created: Oct 27, 2020 5:37 PM
status: Ready
format: stage
tags: #programming #spring
need to know: [[Spring terms]]

# Проблемы зависимости

---

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

### Spring можно конфигурировать с помощью:

- XML файла конфигурации (старый способ, но многие приложения до сих пор его испоьзуют).
- Java аннотаций и немного XML (современный способ).
- Вся конфигурация на Java (современный способ).

## Inversion of Control

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%207.png](Untitled%207.png)

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%208.png](Untitled%208.png)

1. MusicPlayer зависит от СlassicalMusic
2. MusicPlayer сам создает объект ClassicalMusic
3. Вместо этого мы хотим передавать объект ClassicalMusic внуть MusicPlayer - это и называется инверсией управления.

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%209.png](Untitled%209.png)

![Inversion%20of%20Control%20(loC)%20005481af34aa433398846213cb02962c/Untitled%2010.png](Untitled%2010.png)

---
### See next:
- [[$ Dependency Injection]]
- [[$ Bean]]